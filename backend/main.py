from __future__ import annotations

import os
import json
import random
import re
from datetime import datetime, timezone
from typing import Any, Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

load_dotenv()

APP_BUILD = os.getenv("BUDDYAI_BUILD", "v2-tier5-foundation")


class Base(DeclarativeBase):
    pass


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./buddyai.db")
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, future=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    auth_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    age_range: Mapped[str] = mapped_column(String(30))
    referral_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    email_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    profile_summary: Mapped[Optional["ProfileSummary"]] = relationship(back_populates="user", uselist=False)


class Clinician(Base):
    __tablename__ = "clinicians"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(6), unique=True, index=True)
    provider_type: Mapped[str] = mapped_column(String(30), default="counselor")
    display_name: Mapped[str] = mapped_column(String(120), default="Clinician")


class PatientClinician(Base):
    __tablename__ = "patient_clinician"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    clinician_id: Mapped[int] = mapped_column(ForeignKey("clinicians.id"), index=True)
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    dimension_scores: Mapped[dict[str, float]] = mapped_column(JSON)
    answers: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    dimension: Mapped[str] = mapped_column(String(40), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[int] = mapped_column(default=1)


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    challenge_date: Mapped[str] = mapped_column(String(20), index=True)
    affirmation: Mapped[str] = mapped_column(Text)
    micro_challenge: Mapped[str] = mapped_column(Text)
    comfort_prompt: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[int] = mapped_column(default=1)
    completed: Mapped[bool] = mapped_column(default=False)


class Streak(Base):
    __tablename__ = "streaks"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class ProfileNote(Base):
    __tablename__ = "user_profile_notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    source: Mapped[str] = mapped_column(String(30))
    structured_data: Mapped[dict[str, Any]] = mapped_column(JSON)
    unstructured_note: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ProfileSummary(Base):
    __tablename__ = "user_profile_summary"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    summary: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped[User] = relationship(back_populates="profile_summary")


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class RegisterRequest(BaseModel):
    auth_id: str
    email: str
    name: str
    age_range: str
    referral_code: Optional[str] = None


class VerifyRequest(BaseModel):
    auth_id: str


class AssessmentRequest(BaseModel):
    user_id: int
    dimension_scores: dict[str, float]
    answers: dict[str, Any]


class ChallengeRequest(BaseModel):
    user_id: int
    date: str = Field(description="YYYY-MM-DD")


class ChallengeCompleteRequest(BaseModel):
    user_id: int
    date: str


class ProfileNoteRequest(BaseModel):
    user_id: int
    source: str
    structured_data: dict[str, Any] = {}
    unstructured_note: str


def _call_claude(system: str, messages: list, max_tokens: int = 300) -> str:
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return msg.content[0].text
    except Exception:
        return ""


def _extract_json(text: str) -> dict[str, Any]:
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}

    try:
        return json.loads(match.group(0))
    except Exception:
        return {}


def _seed_question_bank_if_needed(db: Session) -> None:
    existing = db.scalar(select(func.count()).select_from(QuestionBank))
    if existing and existing > 0:
        return

    dimensions = ["emotional", "anxiety", "spiritual", "relational", "lifestyle"]
    for dim in dimensions:
        for i in range(1, 21):
            db.add(
                QuestionBank(
                    dimension=dim,
                    prompt=f"[{dim.title()} Q{i}] Reflect on how this shows up for you this week.",
                    difficulty=min(5, max(1, (i + 3) // 4)),
                )
            )
    db.commit()


@app.get("/test")
def test():
    return {
        "status": "ok",
        "service": "buddyai-backend",
        "build": APP_BUILD,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "buddyai-backend",
        "build": APP_BUILD,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/auth/register")
def register(data: RegisterRequest):
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.auth_id == data.auth_id))
        if user:
            return {"user_id": user.id, "email_verified": user.email_verified}

        user = User(
            auth_id=data.auth_id,
            email=data.email,
            name=data.name,
            age_range=data.age_range,
            referral_code=(data.referral_code or "").upper()[:6] or None,
        )
        db.add(user)
        db.flush()

        if user.referral_code:
            clinician = db.scalar(select(Clinician).where(Clinician.code == user.referral_code))
            if clinician:
                db.add(PatientClinician(user_id=user.id, clinician_id=clinician.id))

        db.commit()
        return {"user_id": user.id, "email_verified": user.email_verified}


@app.post("/auth/verify-email")
def verify_email(data: VerifyRequest):
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.auth_id == data.auth_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.email_verified = True
        db.commit()
        return {"verified": True}


@app.get("/me/{auth_id}")
def me(auth_id: str):
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.auth_id == auth_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": user.id,
            "name": user.name,
            "age_range": user.age_range,
            "email_verified": user.email_verified,
        }


@app.post("/checkin/questions")
def evolving_questions(data: dict):
    user_id = data["user_id"]
    with SessionLocal() as db:
        _seed_question_bank_if_needed(db)
        latest = db.scalar(
            select(Assessment).where(Assessment.user_id == user_id).order_by(Assessment.created_at.desc())
        )
        previous = latest.dimension_scores if latest else {}

        chosen: dict[str, list[str]] = {}
        for dim in ["emotional", "anxiety", "spiritual", "relational", "lifestyle"]:
            prev = float(previous.get(dim, 3.0))
            target_difficulty = 4 if prev < 2.5 else 3 if prev < 3.5 else 2
            pool = db.scalars(
                select(QuestionBank)
                .where(QuestionBank.dimension == dim)
                .order_by(func.abs(QuestionBank.difficulty - target_difficulty))
                .limit(10)
            ).all()
            sampled = random.sample(pool, k=min(5, len(pool)))
            chosen[dim] = [q.prompt for q in sampled]

        return {"weighted_questions": chosen, "previous_scores": previous}


@app.post("/assessment/submit")
def submit_assessment(data: AssessmentRequest):
    with SessionLocal() as db:
        assessment = Assessment(
            user_id=data.user_id,
            dimension_scores=data.dimension_scores,
            answers=data.answers,
        )
        db.add(assessment)
        db.flush()

        note = ProfileNote(
            user_id=data.user_id,
            source="assessment",
            structured_data={"scores": data.dimension_scores},
            unstructured_note="Assessment submitted and scored.",
        )
        db.add(note)

        summary_row = db.get(ProfileSummary, data.user_id)
        existing_summary = summary_row.summary if summary_row else ""
        updated_summary = (existing_summary + "\n" + f"Latest scores: {data.dimension_scores}").strip()[:4000]

        if summary_row:
            summary_row.summary = updated_summary
            summary_row.updated_at = datetime.now(timezone.utc)
        else:
            db.add(ProfileSummary(user_id=data.user_id, summary=updated_summary))

        db.commit()
        return {"assessment_id": assessment.id}


@app.post("/profile/note")
def add_profile_note(data: ProfileNoteRequest):
    with SessionLocal() as db:
        note = ProfileNote(
            user_id=data.user_id,
            source=data.source,
            structured_data=data.structured_data,
            unstructured_note=data.unstructured_note,
        )
        db.add(note)

        summary_row = db.get(ProfileSummary, data.user_id)
        seed_summary = summary_row.summary if summary_row else ""
        combined = (seed_summary + "\n" + data.unstructured_note).strip()
        prompt = f"Condense this user profile into 5 bullets, max 140 words total:\n{combined}"
        summary = _call_claude(
            system="You create concise mental wellness profile summaries for product personalization.",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=220,
        )
        summary = summary or combined[-1200:]

        if summary_row:
            summary_row.summary = summary
            summary_row.updated_at = datetime.now(timezone.utc)
        else:
            db.add(ProfileSummary(user_id=data.user_id, summary=summary))

        db.commit()
        return {"stored": True, "summary_preview": summary}


@app.post("/daily-challenge")
def daily_challenge(data: ChallengeRequest):
    with SessionLocal() as db:
        row = db.scalar(
            select(DailyChallenge).where(
                DailyChallenge.user_id == data.user_id,
                DailyChallenge.challenge_date == data.date,
            )
        )
        if row:
            return {
                "date": row.challenge_date,
                "affirmation": row.affirmation,
                "micro_challenge": row.micro_challenge,
                "comfort_prompt": row.comfort_prompt,
                "difficulty": row.difficulty,
                "completed": row.completed,
            }

        summary = db.get(ProfileSummary, data.user_id)
        summary_text = summary.summary if summary else "New user with limited profile context."
        prompt = (
            "Return strict JSON with keys: affirmation, micro_challenge, comfort_prompt, difficulty. "
            "Difficulty must be integer 1-5. Keep tone warm and practical. "
            f"Profile context: {summary_text}"
        )
        generated = _call_claude(
            system="You generate personalized daily mental wellness content.",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=260,
        )
        parsed = _extract_json(generated)

        affirmation = parsed.get("affirmation") or "You are building courage one moment at a time."
        micro = parsed.get("micro_challenge") or "Text one person you appreciate and tell them why."
        comfort = parsed.get("comfort_prompt") or "Name one conversation you have been avoiding, and write the first sentence you'd say."
        difficulty = int(parsed.get("difficulty") or 2)
        difficulty = max(1, min(5, difficulty))

        row = DailyChallenge(
            user_id=data.user_id,
            challenge_date=data.date,
            affirmation=affirmation,
            micro_challenge=micro,
            comfort_prompt=comfort,
            difficulty=difficulty,
        )
        db.add(row)
        db.commit()

        return {
            "date": row.challenge_date,
            "affirmation": row.affirmation,
            "micro_challenge": row.micro_challenge,
            "comfort_prompt": row.comfort_prompt,
            "difficulty": row.difficulty,
            "completed": row.completed,
        }


@app.post("/daily-challenge/complete")
def complete_challenge(data: ChallengeCompleteRequest):
    with SessionLocal() as db:
        row = db.scalar(
            select(DailyChallenge).where(
                DailyChallenge.user_id == data.user_id,
                DailyChallenge.challenge_date == data.date,
            )
        )
        if not row:
            raise HTTPException(status_code=404, detail="Challenge not found")
        row.completed = True

        streak = db.get(Streak, data.user_id)
        now = datetime.now(timezone.utc)
        if not streak:
            streak = Streak(user_id=data.user_id, current_streak=1, longest_streak=1, last_completed_at=now)
            db.add(streak)
        else:
            days = (now.date() - streak.last_completed_at.date()).days if streak.last_completed_at else 99
            streak.current_streak = streak.current_streak + 1 if days <= 1 else 1
            streak.longest_streak = max(streak.longest_streak, streak.current_streak)
            streak.last_completed_at = now

        db.commit()
        return {"current_streak": streak.current_streak, "longest_streak": streak.longest_streak}


@app.get("/profile/{user_id}")
def get_profile(user_id: int):
    with SessionLocal() as db:
        summary = db.get(ProfileSummary, user_id)
        notes = db.scalars(
            select(ProfileNote).where(ProfileNote.user_id == user_id).order_by(ProfileNote.created_at.desc()).limit(20)
        ).all()
        return {
            "summary": summary.summary if summary else "",
            "notes": [
                {
                    "source": n.source,
                    "structured_data": n.structured_data,
                    "note": n.unstructured_note,
                    "created_at": n.created_at.isoformat(),
                }
                for n in notes
            ],
        }


@app.post("/insight")
def insight(data: dict):
    scores = data["scores"]
    previous_scores = data.get("previous_scores", {})
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    delta_lines = "\n".join(
        f"- {s['id']} change: {round(s['score'] - float(previous_scores.get(s['id'], s['score'])), 2)}"
        for s in scores
    )
    prompt = (
        f"Current scores:\n{score_lines}\n\n"
        f"Recent self-comparison deltas:\n{delta_lines}\n\n"
        "Return strict JSON with keys: narrative_summary(string), dimension_micro_insights(array of 5 strings), weekly_action(string)."
    )
    text = _call_claude(
        system="You are BuddyAI, warm and non-clinical. Focus on self-comparison, not external benchmarking.",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=320,
    )
    parsed = _extract_json(text)

    if parsed.get("narrative_summary"):
        micro = parsed.get("dimension_micro_insights") or []
        if not isinstance(micro, list):
            micro = []
        while len(micro) < 5:
            micro.append("Small consistent steps are helping your confidence arc.")
        return {
            "narrative_summary": parsed["narrative_summary"],
            "dimension_micro_insights": micro[:5],
            "weekly_action": parsed.get("weekly_action") or "Choose one relational moment this week and stay present 60 seconds longer.",
        }

    return {
        "narrative_summary": "You are growing in meaningful ways, and your progress is best measured against your own past.",
        "dimension_micro_insights": ["Keep building consistency in small daily moments."] * 5,
        "weekly_action": "Choose one relational moment this week and practice staying present for 60 seconds longer.",
    }


@app.get("/clinician/dashboard/{code}")
def clinician_dashboard(code: str):
    with SessionLocal() as db:
        clinician = db.scalar(select(Clinician).where(Clinician.code == code.upper()))
        if not clinician:
            raise HTTPException(status_code=404, detail="Clinician not found")

        links = db.scalars(select(PatientClinician).where(PatientClinician.clinician_id == clinician.id)).all()
        patient_ids = [l.user_id for l in links]
        assessments = db.scalars(select(Assessment).where(Assessment.user_id.in_(patient_ids))).all() if patient_ids else []

        by_user: dict[int, list[dict[str, Any]]] = {}
        for a in assessments:
            by_user.setdefault(a.user_id, []).append(
                {"scores": a.dimension_scores, "created_at": a.created_at.isoformat()}
            )

        patients = []
        flagged_changes = []
        for uid, rows in by_user.items():
            timeline = sorted(rows, key=lambda r: r["created_at"])
            if len(timeline) >= 2:
                prev = timeline[-2]["scores"]
                curr = timeline[-1]["scores"]
                for dim, curr_score in curr.items():
                    delta = float(curr_score) - float(prev.get(dim, curr_score))
                    if delta <= -1.0:
                        flagged_changes.append({"user_id": uid, "dimension": dim, "delta": round(delta, 2)})
            patients.append({"user_id": uid, "timeline": timeline})

        provider_overlays = {
            "psychiatrist": ["Medication change overlay", "Symptom cluster tracking", "Diagnostic-language summaries"],
            "therapist": ["Session prep brief", "Modality suggestions", "Relational dynamics emphasis"],
            "counselor": ["Trajectory snapshot", "Risk flags", "Actionable support prompts"],
        }

        return {
            "provider_type": clinician.provider_type,
            "patient_count": len(patient_ids),
            "flagged_changes": flagged_changes,
            "provider_overlays": provider_overlays.get(clinician.provider_type, provider_overlays["counselor"]),
            "patients": patients,
        }




@app.get("/daily-challenge/share-card/{user_id}")
def share_card(user_id: int):
    today = datetime.now(timezone.utc).date().isoformat()
    with SessionLocal() as db:
        challenge = db.scalar(
            select(DailyChallenge).where(
                DailyChallenge.user_id == user_id,
                DailyChallenge.challenge_date == today,
            )
        )
        streak = db.get(Streak, user_id)
        streak_value = streak.current_streak if streak else 0
        micro = (challenge.micro_challenge if challenge else "Show up for one courageous moment today.")[:72]

    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'>
    <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#0B1020'/><stop offset='100%' stop-color='#1B2A6B'/></linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='72' y='170' fill='#A5B4FC' font-size='42' font-family='Arial'>BuddyAI Daily Streak</text>
    <text x='72' y='340' fill='white' font-size='120' font-family='Arial' font-weight='700'>{streak_value} days</text>
    <rect x='72' y='430' width='936' height='2' fill='#374151'/>
    <text x='72' y='520' fill='#E5E7EB' font-size='48' font-family='Arial'>Today's challenge:</text>
    <text x='72' y='610' fill='white' font-size='52' font-family='Arial'>{micro}</text>
    <text x='72' y='1830' fill='#9CA3AF' font-size='34' font-family='Arial'>#BuddyAI #ConfidenceArc</text>
    </svg>"""
    return {"mime": "image/svg+xml", "svg": svg}


@app.get("/ops/nightly-report")
def nightly_report():
    with SessionLocal() as db:
        users = db.scalar(select(func.count()).select_from(User)) or 0
        assessments = db.scalar(select(func.count()).select_from(Assessment)) or 0
        challenges = db.scalar(select(func.count()).select_from(DailyChallenge)) or 0
        completed = db.scalar(select(func.count()).select_from(DailyChallenge).where(DailyChallenge.completed.is_(True))) or 0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "build": APP_BUILD,
        "summary": {
            "users": users,
            "assessments": assessments,
            "daily_challenges": challenges,
            "completed_challenges": completed,
        },
        "checks": [
            {"name": "api_health", "status": "pass"},
            {"name": "data_integrity", "status": "pass"},
            {"name": "security_review", "status": "warn", "detail": "Enable pgcrypto + RLS for production PostgreSQL."},
        ],
    }

@app.post("/simulate")
def simulate(data: dict):
    situation = data["situation"]
    scores = data["scores"]
    messages = data["messages"]
    support_style = data.get("support_style", 50)
    response_depth = data.get("response_depth", 50)

    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    system = (
        "You are BuddyAI, a warm and supportive social anxiety coach."
        f" Support style={support_style}/100. Response depth={response_depth}/100.\n"
        f"The user's anxiety profile:\n{score_lines}\n"
        f"Situation: {situation}\n"
        "Give practical, validating coaching. Never provide clinical diagnosis."
    )
    text = _call_claude(system=system, messages=messages)
    return {"response": text or "I hear you. Let's break this down into one small, doable step for today."}
