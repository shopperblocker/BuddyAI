import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const DIMENSIONS = [
  { id: "emotional", label: "Emotional Resilience" },
  { id: "anxiety", label: "Anxiety & Mental Clarity" },
  { id: "spiritual", label: "Spiritual Connection" },
  { id: "relational", label: "Relational Wellness" },
  { id: "lifestyle", label: "Body & Lifestyle Balance" },
];

const ONBOARDING = [
  {
    title: "Welcome to BuddyAI",
    body: "A calm, daily companion that helps you prepare for social moments with confidence.",
  },
  {
    title: "Your data, your control",
    body: "We collect only what is needed to personalize your journey. Clinicians see trends, not raw chat logs.",
  },
  {
    title: "What happens next",
    body: "You will complete a check-in, receive a personalized insight, and start daily growth challenges.",
  },
];

function Shell({ children }) {
  return <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>{children}</main>;
}

function Card({ title, children }) {
  return (
    <section style={{ background: "#fff", borderRadius: 18, border: "1px solid #EAECF0", padding: 20, marginBottom: 16 }}>
      {title ? <h3 style={{ marginBottom: 10 }}>{title}</h3> : null}
      {children}
    </section>
  );
}

function SignUp({ onDone }) {
  const [form, setForm] = useState({ name: "", age_range: "18-24", referral_code: "", email: "", auth_id: "demo-user" });

  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    localStorage.setItem("buddy_user_id", String(data.user_id));
    localStorage.setItem("buddy_auth_id", form.auth_id);
    onDone(data.email_verified);
  };

  return (
    <Shell>
      <Card title="Create profile">
        <p style={{ color: "#475467", marginBottom: 16 }}>Lightweight signup for rapid onboarding and personalization.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })}>
            <option>13-17</option>
            <option>18-24</option>
            <option>25-34</option>
            <option>35+</option>
          </select>
          <input placeholder="Referral code (optional)" value={form.referral_code} maxLength={6} onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })} />
          <button type="submit">Continue</button>
        </form>
      </Card>
    </Shell>
  );
}

function VerifyEmail({ onVerified }) {
  const verify = async () => {
    const auth_id = localStorage.getItem("buddy_auth_id") || "demo-user";
    await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_id }),
    });
    onVerified();
  };

  return (
    <Shell>
      <Card title="Verify email">
        <p style={{ marginBottom: 12 }}>For this build, verification is simulated with one click.</p>
        <button onClick={verify}>I verified my email</button>
      </Card>
    </Shell>
  );
}

function Onboarding({ onFinish }) {
  const [i, setI] = useState(0);
  const slide = ONBOARDING[i];

  return (
    <Shell>
      <Card title={slide.title}>
        <p style={{ marginBottom: 12 }}>{slide.body}</p>
        <button onClick={() => (i === ONBOARDING.length - 1 ? onFinish() : setI(i + 1))}>{i === ONBOARDING.length - 1 ? "Start" : "Next"}</button>
      </Card>
    </Shell>
  );
}

function CheckIn({ onSubmitted }) {
  const [scores, setScores] = useState(() => Object.fromEntries(DIMENSIONS.map((d) => [d.id, 3])));

  const submit = async () => {
    const user_id = Number(localStorage.getItem("buddy_user_id") || 1);
    await fetch(`${API_BASE}/assessment/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, dimension_scores: scores, answers: {} }),
    });
    onSubmitted(scores);
  };

  return (
    <Card title="Weekly check-in">
      {DIMENSIONS.map((d) => (
        <div key={d.id} style={{ marginBottom: 10 }}>
          <label>{d.label}: {scores[d.id]}</label>
          <input type="range" min="1" max="5" step="0.1" value={scores[d.id]} onChange={(e) => setScores({ ...scores, [d.id]: Number(e.target.value) })} style={{ width: "100%" }} />
        </div>
      ))}
      <button onClick={submit}>Generate insight</button>
    </Card>
  );
}

function Results({ scores, onContinue }) {
  const [insight, setInsight] = useState(null);

  const payload = useMemo(() => DIMENSIONS.map((d) => ({ id: d.id, label: d.label, score: scores[d.id] })), [scores]);

  useEffect(() => {
    fetch(`${API_BASE}/insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: payload }),
    })
      .then((r) => r.json())
      .then(setInsight)
      .catch(() => setInsight(null));
  }, [payload]);

  return (
    <Card title="Personal insight arc">
      <p style={{ color: "#475467" }}>Self-comparison first. No leaderboard, no ranking.</p>
      <ul>
        {payload.map((p) => <li key={p.id}>{p.label}: {p.score.toFixed(1)}</li>)}
      </ul>

      <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 12 }}>
        <p><strong>Narrative:</strong> {insight?.narrative_summary || "Generating..."}</p>
        <p><strong>Weekly action:</strong> {insight?.weekly_action || "Generating..."}</p>
        <ul>
          {(insight?.dimension_micro_insights || []).map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      </div>

      <button style={{ marginTop: 12 }} onClick={onContinue}>Go to dashboard</button>
    </Card>
  );
}

function Breathwork() {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, seconds]);

  return (
    <Card title="Breathwork">
      <p>Guided calm timer: {seconds}s</p>
      <button onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Start"}</button>
    </Card>
  );
}

function Sounds() {
  const [track, setTrack] = useState("rain");
  return (
    <Card title="Sounds">
      <p>Ambient mode (placeholder):</p>
      <select value={track} onChange={(e) => setTrack(e.target.value)}>
        <option value="rain">Rain</option>
        <option value="bowls">Singing Bowls</option>
        <option value="white-noise">White Noise</option>
      </select>
    </Card>
  );
}

function Poetry() {
  return (
    <Card title="Poetry">
      <p>&ldquo;Courage starts quietly — one honest breath, one brave sentence, one step toward connection.&rdquo;</p>
    </Card>
  );
}

function DailyChallenges() {
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak] = useState(null);
  const [share, setShare] = useState(null);

  useEffect(() => {
    const user_id = Number(localStorage.getItem("buddy_user_id") || 1);
    const date = new Date().toISOString().slice(0, 10);
    fetch(`${API_BASE}/daily-challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, date }),
    }).then((r) => r.json()).then(setChallenge);
  }, []);

  const complete = async () => {
    const user_id = Number(localStorage.getItem("buddy_user_id") || 1);
    const date = new Date().toISOString().slice(0, 10);
    const r = await fetch(`${API_BASE}/daily-challenge/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, date }),
    });
    setStreak(await r.json());
  };

  const loadShareCard = async () => {
    const user_id = Number(localStorage.getItem("buddy_user_id") || 1);
    const r = await fetch(`${API_BASE}/daily-challenge/share-card/${user_id}`);
    const data = await r.json();
    setShare(data.svg);
  };

  return (
    <Card title="Daily challenge + streak">
      {challenge ? (
        <>
          <p><strong>Affirmation:</strong> {challenge.affirmation}</p>
          <p><strong>Micro challenge:</strong> {challenge.micro_challenge}</p>
          <p><strong>Comfort prompt:</strong> {challenge.comfort_prompt}</p>
          <button onClick={complete}>Complete challenge</button>
          <button style={{ marginLeft: 8 }} onClick={loadShareCard}>Generate share card</button>
        </>
      ) : <p>Loading...</p>}
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(streak, null, 2)}</pre>
      {share ? <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: share }} /> : null}
    </Card>
  );
}

function VoiceCoach() {
  const [transcript, setTranscript] = useState("");

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Web Speech API not available in this browser.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.onresult = (event) => setTranscript(event.results[0][0].transcript);
    recog.start();
  };

  const speak = () => {
    const text = transcript || "You are doing better than you think. Keep going.";
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <Card title="Voice prompts and responses (v2)">
      <button onClick={startVoice}>Capture voice input</button>
      <button style={{ marginLeft: 8 }} onClick={speak}>Speak response</button>
      <p>{transcript}</p>
    </Card>
  );
}

function Dashboard() {
  const [tab, setTab] = useState("insights");

  return (
    <>
      {tab === "insights" ? <Card title="Personal Insights"><p>Your evolving profile powers tailored support.</p></Card> : null}
      {tab === "challenges" ? <DailyChallenges /> : null}
      {tab === "breathwork" ? <Breathwork /> : null}
      {tab === "sounds" ? <Sounds /> : null}
      {tab === "poetry" ? <Poetry /> : null}
      {tab === "voice" ? <VoiceCoach /> : null}

      <div style={{ position: "sticky", bottom: 16, background: "#fff", border: "1px solid #EAECF0", borderRadius: 12, padding: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["insights", "Insights"],
          ["challenges", "Challenges"],
          ["breathwork", "Breathwork"],
          ["sounds", "Sounds"],
          ["poetry", "Poetry"],
          ["voice", "Voice"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: tab === key ? "#2D5BFF" : "#111827" }}>{label}</button>
        ))}
      </div>
    </>
  );
}

export default function DiagnosticApp() {
  const [step, setStep] = useState("signup");
  const [scores, setScores] = useState(null);

  if (step === "signup") return <SignUp onDone={(verified) => setStep(verified ? "onboarding" : "verify")} />;
  if (step === "verify") return <VerifyEmail onVerified={() => setStep("onboarding")} />;
  if (step === "onboarding") return <Onboarding onFinish={() => setStep("checkin")} />;

  return (
    <Shell>
      {step === "checkin" ? <CheckIn onSubmitted={(s) => { setScores(s); setStep("results"); }} /> : null}
      {step === "results" && scores ? <Results scores={scores} onContinue={() => setStep("dashboard")} /> : null}
      {step === "dashboard" ? <Dashboard /> : null}
    </Shell>
  );
}
