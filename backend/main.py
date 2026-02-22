from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anthropic, os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"],
allow_methods=["*"], allow_headers=["*"])

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@app.get("/test")
def test():
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": "Say hello in one sentence."}]
        )
        return {"response": message.content[0].text}
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key")
    except anthropic.APIStatusError as e:
        if e.status_code == 529:
            raise HTTPException(status_code=503, detail="Anthropic API overloaded, try again shortly")
        raise HTTPException(status_code=502, detail=f"Anthropic API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not connect to Anthropic API")


def _call_claude(system: str, messages: list, max_tokens: int = 300) -> str:
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return msg.content[0].text
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key")
    except anthropic.APIStatusError as e:
        if e.status_code == 529:
            raise HTTPException(status_code=503, detail="Anthropic API overloaded, try again shortly")
        raise HTTPException(status_code=502, detail=f"Anthropic API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not connect to Anthropic API")


@app.post("/insight")
def insight(data: dict):
    scores = data["scores"]  # [{id, label, score}, ...]
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    prompt = (
        f"A person completed a social anxiety wellness assessment. Their scores:\n{score_lines}\n\n"
        "Write exactly 3 sentences as a warm, non-clinical response in second person:\n"
        "1. What their overall pattern reveals about how social anxiety shows up for them.\n"
        "2. Their biggest growth area and why it matters for their social confidence.\n"
        "3. One specific, concrete action they can take this week.\n"
        "Be encouraging and speak like a trusted friend, not a therapist. Under 100 words total."
    )
    text = _call_claude(
        system="You are BuddyAI, a warm and supportive social anxiety companion. Speak like a caring friend.",
        messages=[{"role": "user", "content": prompt}],
    )
    return {"insight": text}


@app.post("/simulate")
def simulate(data: dict):
    situation = data["situation"]
    scores = data["scores"]  # [{id, label, score}, ...]
    messages = data["messages"]  # [{role, content}, ...]
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    system = (
        "You are BuddyAI, a warm and supportive social anxiety coach. "
        "You speak like a calm, trusted friend — never clinical or preachy.\n\n"
        f"The user's anxiety profile:\n{score_lines}\n\n"
        f"The situation they're preparing for: {situation}\n\n"
        "Your role: help them feel prepared and less afraid. Ask thoughtful follow-up questions "
        "to understand their specific fears. Offer gentle reframes that feel realistic — not toxic positivity. "
        "Give concrete tips when they seem ready. Keep each response to 2–4 sentences. "
        "Never minimize their feelings."
    )
    text = _call_claude(system=system, messages=messages)
    return {"response": text}


# ── In-memory stores (demo/hackathon — no DB required) ──────────────────────
_users: dict = {}
_assessments: list = []


@app.post("/auth/register")
def auth_register(data: dict):
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    if email in _users:
        raise HTTPException(status_code=409, detail="email already registered")
    user_id = f"usr_{len(_users) + 1}"
    _users[email] = {"id": user_id, "email": email, "name": name, "verified": False}
    return {"user_id": user_id, "email": email, "message": "Verification email sent (demo: any token works)"}


@app.post("/auth/verify-email")
def auth_verify_email(data: dict):
    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    if email not in _users:
        raise HTTPException(status_code=404, detail="user not found")
    _users[email]["verified"] = True
    return {"message": "Email verified successfully", "email": email}


@app.post("/assessment/submit")
def assessment_submit(data: dict):
    scores = data.get("scores", [])
    user_id = data.get("user_id", "anonymous")
    if not scores:
        raise HTTPException(status_code=400, detail="scores array is required")
    assessment_id = f"asmnt_{len(_assessments) + 1}"
    _assessments.append({"id": assessment_id, "user_id": user_id, "scores": scores})
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    prompt = (
        f"A user completed a social anxiety assessment. Scores:\n{score_lines}\n\n"
        "Write 2 warm, encouraging sentences: what their profile reveals, "
        "and one small step they can take today."
    )
    insight = _call_claude(
        system="You are BuddyAI, a supportive social anxiety companion. Speak like a caring friend.",
        messages=[{"role": "user", "content": prompt}],
    )
    return {"assessment_id": assessment_id, "insight": insight}


@app.post("/daily-challenge")
def daily_challenge(data: dict):
    scores = data.get("scores", [])
    score_lines = (
        "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
        if scores else "General social anxiety support"
    )
    prompt = (
        f"User anxiety profile:\n{score_lines}\n\n"
        "Create one gentle daily micro-challenge for social anxiety. "
        'Respond in this exact JSON format:\n'
        '{"title": "<5 words max>", "description": "<2 sentences, warm and specific>", "difficulty": "<easy|medium|hard>"}'
    )
    text = _call_claude(
        system="You are BuddyAI, designing daily micro-challenges for social anxiety. Always respond with valid JSON only.",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
    )
    return {"challenge": text}


# ── Tier 4: Share card ───────────────────────────────────────────────────────
@app.get("/daily-challenge/share-card/{user_id}")
def share_card(user_id: str):
    """Generate a shareable progress card for a user based on their latest assessment."""
    assessment = next(
        (a for a in reversed(_assessments) if a["user_id"] == user_id),
        None,
    )
    if not assessment:
        return {
            "user_id": user_id,
            "card": {
                "title": "My BuddyAI Journey",
                "overall_score": None,
                "badge": "🌱 Starting Strong",
                "message": "I'm working on my social wellness with BuddyAI!",
                "dimensions": {},
            },
        }
    scores = assessment["scores"]
    avg = round(sum(s["score"] for s in scores) / len(scores), 1) if scores else 0.0
    badge = (
        "🌟 Thriving" if avg >= 4.0
        else "💪 Growing" if avg >= 3.0
        else "🌱 Building" if avg >= 2.0
        else "🤝 Supported"
    )
    return {
        "user_id": user_id,
        "assessment_id": assessment["id"],
        "card": {
            "title": "My BuddyAI Wellness Card",
            "overall_score": avg,
            "badge": badge,
            "message": f"Scored {avg}/5.0 on my social wellness assessment",
            "dimensions": {s["label"]: s["score"] for s in scores},
        },
    }


# ── Tier 5: Ops nightly report ───────────────────────────────────────────────
@app.get("/ops/nightly-report")
def nightly_report():
    """Operational summary for nightly health check and admin monitoring."""
    total_users = len(_users)
    total_assessments = len(_assessments)
    all_avgs = [
        sum(s["score"] for s in a["scores"]) / len(a["scores"])
        for a in _assessments if a.get("scores")
    ]
    avg_wellness = round(sum(all_avgs) / len(all_avgs), 2) if all_avgs else 0.0
    flagged = [a["user_id"] for a in _assessments if all_avgs and
               (sum(s["score"] for s in a["scores"]) / len(a["scores"])) < 2.0]
    return {
        "report": "nightly",
        "version": "v2",
        "status": "healthy",
        "total_users": total_users,
        "total_assessments": total_assessments,
        "avg_wellness_score": avg_wellness,
        "low_score_user_ids": flagged,
    }
