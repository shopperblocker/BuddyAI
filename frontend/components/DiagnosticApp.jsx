import { useState, useEffect, useRef, useMemo } from "react";

const DIMENSIONS = [
  {
    id: "emotional",
    label: "Emotional Resilience",
    color: "#6366F1",
    colorLight: "#E0E7FF",
    icon: "💜",
    description: "How you carry the emotional weight of social moments",
    questions: [
      "I can sit with uncomfortable emotions without needing to escape or numb them.",
      "When I feel overwhelmed, I have healthy ways to bring myself back to calm.",
      "I allow myself to feel sadness or grief without judging myself for it.",
      "I recover from emotional setbacks within a reasonable amount of time.",
      "I can express my emotions openly to people I trust.",
    ],
  },
  {
    id: "anxiety",
    label: "Anxiety & Mental Clarity",
    color: "#EC4899",
    colorLight: "#FCE7F3",
    icon: "🧠",
    description: "Your experience with social worry, overthinking, and racing thoughts",
    questions: [
      "I am able to quiet my mind when I need to rest or focus.",
      "I don't frequently catastrophize or assume the worst outcome.",
      "I feel a general sense of safety in my day-to-day life.",
      "Racing or intrusive thoughts do not dominate my daily experience.",
      "I can make decisions without excessive doubt or second-guessing.",
    ],
  },
  {
    id: "spiritual",
    label: "Spiritual Connection",
    color: "#F59E0B",
    colorLight: "#FEF3C7",
    icon: "✨",
    description: "Your sense of inner worth and calm beyond what others think of you",
    questions: [
      "I feel connected to a sense of purpose or meaning in my life.",
      "I engage in practices (prayer, meditation, reflection) that ground me spiritually.",
      "I feel a sense of awe or gratitude on a regular basis.",
      "I trust that there is a larger arc or direction to my life, even during hard times.",
      "I feel aligned between my daily actions and my deeper values or beliefs.",
    ],
  },
  {
    id: "social",
    label: "Relational Wellness",
    color: "#10B981",
    colorLight: "#D1FAE5",
    icon: "🤝",
    description: "Your comfort with vulnerability, closeness, and being truly seen",
    questions: [
      "I have at least one person I can be completely honest with about how I'm feeling.",
      "I set healthy boundaries without guilt in my relationships.",
      "I feel seen and understood by the people closest to me.",
      "I don't regularly feel lonely or socially disconnected.",
      "I can navigate conflict in relationships without shutting down or lashing out.",
    ],
  },
  {
    id: "lifestyle",
    label: "Body & Lifestyle Balance",
    color: "#0EA5E9",
    colorLight: "#E0F2FE",
    icon: "🌿",
    description: "Daily habits that either fuel or gently quiet your social anxiety",
    questions: [
      "I consistently get enough quality sleep to feel rested.",
      "I move my body in ways that feel good to me on a regular basis.",
      "I nourish myself with food that makes me feel energized, not depleted.",
      "I have a sustainable balance between productivity and rest.",
      "I limit habits I know are harmful to my wellbeing (doomscrolling, substance use, etc).",
    ],
  },
];

const SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

function RadarChart({ scores, size = 300 }) {
  const center = size / 2;
  const radius = size / 2 - 50;
  const angleStep = (2 * Math.PI) / DIMENSIONS.length;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index, value) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPoints = DIMENSIONS.map((_, i) => {
    const p = getPoint(i, scores[i]);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levels.map((level) => {
        const pts = DIMENSIONS.map((_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        }).join(" ");
        return <polygon key={level} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" />;
      })}
      {DIMENSIONS.map((_, i) => {
        const p = getPoint(i, 5);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints} fill="url(#radarGradient)" stroke="#6366F1" strokeWidth="2.5" opacity="0.85" />
      {DIMENSIONS.map((dim, i) => {
        const p = getPoint(i, scores[i]);
        return <circle key={i} cx={p.x} cy={p.y} r="5" fill={dim.color} stroke="white" strokeWidth="2" />;
      })}
      {DIMENSIONS.map((dim, i) => {
        const p = getPoint(i, 5.8);
        const isTop = i === 0;
        const isBottom = i === 2 || i === 3;
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle"
            dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "middle"}
            fontSize="11" fontWeight="600" fill="#374151">
            {dim.icon} {dim.label.split(" ")[0]}
          </text>
        );
      })}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#EC4899" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getScoreColor(score) {
  if (score >= 4.0) return { bg: "#DCFCE7", text: "#166534", bar: "#22C55E", label: "Strong" };
  if (score >= 3.0) return { bg: "#FEF9C3", text: "#854D0E", bar: "#EAB308", label: "Developing" };
  if (score >= 2.0) return { bg: "#FFEDD5", text: "#9A3412", bar: "#F97316", label: "Needs Attention" };
  return { bg: "#FEE2E2", text: "#991B1B", bar: "#EF4444", label: "Priority Area" };
}

function Nav({ phase }) {
  const steps = ["Assessment", "Results", "Simulator"];
  const phaseToIndex = { quiz: 0, results: 1, simulator: 2 };
  const currentIdx = phaseToIndex[phase] ?? 0;
  const isDark = phase !== "results";

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", padding: "14px 0",
      borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F3F4F6",
    }}>
      {steps.map((label, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 99,
              background: isActive ? (isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)") : "transparent",
              border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                background: isActive ? "#6366F1" : isDone ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"),
                color: (isActive || isDone) ? "white" : (isDark ? "#6B7280" : "#9CA3AF"),
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: isActive
                  ? (isDark ? "#A78BFA" : "#6366F1")
                  : isDone
                    ? (isDark ? "#6EE7B7" : "#10B981")
                    : (isDark ? "#4B5563" : "#9CA3AF"),
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 20, height: 1, background: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultsView({ answers, onSimulate }) {
  const dimensionScores = DIMENSIONS.map((dim, di) => {
    const qScores = dim.questions.map((_, qi) => answers[di]?.[qi] || 0);
    const avg = qScores.reduce((a, b) => a + b, 0) / qScores.length;
    return Math.round(avg * 10) / 10;
  });

  const overallScore = Math.round(
    (dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length) * 10
  ) / 10;
  const overallColor = getScoreColor(overallScore);

  const sorted = dimensionScores
    .map((s, i) => ({ score: s, dim: DIMENSIONS[i] }))
    .sort((a, b) => b.score - a.score);

  const scoresPayload = useMemo(
    () => DIMENSIONS.map((dim, i) => ({ id: dim.id, label: dim.label, score: dimensionScores[i] })),
    // dimensionScores values are stable after quiz completion
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: scoresPayload }),
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => { setInsight(data.insight); setInsightLoading(false); })
      .catch(() => { setInsightError("Couldn't load your insight right now."); setInsightLoading(false); });
  }, [scoresPayload]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Overall score */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#9CA3AF", marginBottom: 4 }}>
          Your Wellness Profile
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: overallColor.bg, padding: "10px 24px", borderRadius: 99,
          border: `1px solid ${overallColor.bar}22`,
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: overallColor.text }}>{overallScore}</span>
          <span style={{ fontSize: 14, color: overallColor.text, fontWeight: 500 }}>/ 5.0 Overall</span>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <RadarChart scores={dimensionScores} size={320} />
      </div>

      {/* Personal Insight */}
      <div style={{
        background: "linear-gradient(135deg, #EEF2FF, #FDF2F8)",
        borderRadius: 16, padding: 24, marginBottom: 24,
        border: "1px solid rgba(99,102,241,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#1F2937", margin: 0 }}>Your Personal Insight</p>
        </div>
        {insightLoading ? (
          <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0 }}>
            Generating your personalized insight...
          </p>
        ) : insightError ? (
          <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0 }}>{insightError}</p>
        ) : (
          <p style={{ lineHeight: 1.8, color: "#374151", fontSize: 15, margin: 0 }}>{insight}</p>
        )}
      </div>

      {/* Practice button */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <button
          onClick={() => onSimulate(scoresPayload)}
          style={{
            padding: "14px 32px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #6366F1, #EC4899)",
            color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
          }}
        >
          🎭 Practice a Real Situation
        </button>
        <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 8 }}>
          Use BuddyAI to rehearse a social situation you&apos;re dreading
        </p>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {sorted.map(({ score, dim }) => {
          const sc = getScoreColor(score);
          return (
            <div key={dim.id} style={{
              background: "white", borderRadius: 14, padding: "16px 20px",
              border: "1px solid #F3F4F6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{dim.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{dim.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    borderRadius: 99, background: sc.bg, color: sc.text,
                  }}>{sc.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: sc.text }}>{score}</span>
                </div>
              </div>
              <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${(score / 5) * 100}%`,
                  background: `linear-gradient(90deg, ${dim.color}, ${sc.bar})`,
                  borderRadius: 99, transition: "width 0.8s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Color key */}
      <div style={{ background: "#FAFAFA", borderRadius: 16, padding: 24, border: "1px solid #F3F4F6" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#1F2937", marginBottom: 12 }}>Color Key</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            { min: 4, max: 5, ...getScoreColor(4.5) },
            { min: 3, max: 3.9, ...getScoreColor(3.5) },
            { min: 2, max: 2.9, ...getScoreColor(2.5) },
            { min: 1, max: 1.9, ...getScoreColor(1.5) },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: item.bg, padding: "6px 14px", borderRadius: 99,
              border: `1px solid ${item.bar}33`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: item.bar }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: item.text }}>
                {item.label} ({item.min}–{item.max})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimulatorView({ scores }) {
  const [situation, setSituation] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const MAX_TURNS = 6;

  const userTurnCount = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (content) => {
    if (loading || userTurnCount >= MAX_TURNS) return;
    const updated = [...messages, { role: "user", content }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, scores, messages: updated }),
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I had trouble connecting. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const handleStart = () => {
    if (!situation.trim()) return;
    setStarted(true);
    send(`I'm feeling anxious about: ${situation}`);
  };

  if (!started) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎭</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>
            Practice a Real Situation
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Tell BuddyAI what social situation you&apos;re dreading. It&apos;ll coach you through it like a calm, trusted friend — no pressure, no judgment.
          </p>
        </div>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="e.g. I have a job interview tomorrow, I need to speak up in a meeting, I'm going to a party where I don't know anyone..."
          rows={4}
          style={{
            width: "100%", padding: "16px", borderRadius: 14, boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "white", fontSize: 14, lineHeight: 1.7, resize: "vertical",
            outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleStart}
          disabled={!situation.trim()}
          style={{
            width: "100%", marginTop: 12, padding: "14px", borderRadius: 12, border: "none",
            background: situation.trim() ? "linear-gradient(135deg, #6366F1, #EC4899)" : "rgba(255,255,255,0.08)",
            color: situation.trim() ? "white" : "#6B7280",
            fontSize: 15, fontWeight: 700, cursor: situation.trim() ? "pointer" : "not-allowed",
          }}
        >
          Start Practice Session →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 520, margin: "0 auto", padding: "0 24px 24px",
      display: "flex", flexDirection: "column", flex: 1, overflow: "hidden",
    }}>
      {/* Situation context */}
      <div style={{
        padding: "10px 16px", borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        margin: "16px 0 8px",
      }}>
        <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 1 }}>
          Practicing for
        </p>
        <p style={{ fontSize: 13, color: "white", margin: 0, fontWeight: 500 }}>{situation}</p>
      </div>

      {/* Turn counter */}
      <div style={{ textAlign: "right", marginBottom: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#6B7280" }}>
          {Math.max(0, MAX_TURNS - userTurnCount)} turns remaining
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "12px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #6366F1, #EC4899)"
                : "rgba(255,255,255,0.08)",
              color: "white", fontSize: 14, lineHeight: 1.6,
            }}>
              {msg.role === "assistant" && (
                <span style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  BuddyAI
                </span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
              background: "rgba(255,255,255,0.06)", color: "#9CA3AF", fontSize: 13,
            }}>
              <span style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600, display: "block", marginBottom: 4 }}>BuddyAI</span>
              thinking...
            </div>
          </div>
        )}
        {userTurnCount >= MAX_TURNS && !loading && (
          <div style={{
            textAlign: "center", padding: 16, borderRadius: 12,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <p style={{ color: "#A78BFA", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Session complete 💜</p>
            <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>You&apos;ve completed 6 turns. You&apos;ve got this.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {userTurnCount < MAX_TURNS && (
        <div style={{
          display: "flex", gap: 8, paddingTop: 12, flexShrink: 0, marginTop: 8,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && input.trim() && !loading) {
                e.preventDefault();
                send(input.trim());
              }
            }}
            placeholder="Reply to BuddyAI..."
            disabled={loading}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => input.trim() && !loading && send(input.trim())}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 18px", borderRadius: 12, border: "none",
              background: input.trim() && !loading ? "#6366F1" : "rgba(255,255,255,0.08)",
              color: input.trim() && !loading ? "white" : "#6B7280",
              fontWeight: 700, fontSize: 16, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiagnosticApp() {
  const [phase, setPhase] = useState("intro");
  const [currentDim, setCurrentDim] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedValue, setSelectedValue] = useState(null);
  const [simulatorScores, setSimulatorScores] = useState(null);

  const totalQuestions = 25;
  const answeredCount = Object.values(answers).reduce(
    (sum, dimAnswers) => sum + Object.keys(dimAnswers).length, 0
  );

  const handleAnswer = (value) => {
    setSelectedValue(value);
    setTimeout(() => {
      setAnswers((prev) => ({
        ...prev,
        [currentDim]: { ...prev[currentDim], [currentQ]: value },
      }));
      setSelectedValue(null);
      if (currentQ < 4) {
        setCurrentQ(currentQ + 1);
      } else if (currentDim < 4) {
        setCurrentDim(currentDim + 1);
        setCurrentQ(0);
      } else {
        setPhase("results");
      }
    }, 300);
  };

  const handleSimulate = (scores) => {
    setSimulatorScores(scores);
    setPhase("simulator");
  };

  const resetApp = () => {
    setPhase("intro");
    setCurrentDim(0);
    setCurrentQ(0);
    setAnswers({});
    setSimulatorScores(null);
  };

  const dim = DIMENSIONS[currentDim];
  const progress = ((currentDim * 5 + currentQ) / totalQuestions) * 100;

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', -apple-system, sans-serif", padding: 24,
      }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🫂</div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: "white", marginBottom: 8,
            background: "linear-gradient(135deg, #A78BFA, #EC4899, #F59E0B)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>BuddyAI</h1>
          <p style={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Feeling anxious in social situations is more common than you think. 25 honest questions to understand where your anxiety lives — and a coach to help you face it.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left" }}>
            {DIMENSIONS.map((d) => (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.05)", borderRadius: 12,
                padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: 20 }}>{d.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "white", margin: 0 }}>{d.label}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{d.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase("quiz")}
            style={{
              width: "100%", padding: "16px 32px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #6366F1, #EC4899)",
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}
          >
            Begin Assessment →
          </button>
          <p style={{ color: "#6B7280", fontSize: 12, marginTop: 12 }}>Takes about 3–5 minutes</p>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div style={{
        minHeight: "100vh", background: "#F9FAFB",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <Nav phase={phase} />
        <div style={{ padding: "32px 20px 60px" }}>
          <ResultsView answers={answers} onSimulate={handleSimulate} />
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={resetApp}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "1px solid #E5E7EB",
                background: "white", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ↻ Retake Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Simulator ──────────────────────────────────────────────────────────────
  if (phase === "simulator") {
    return (
      <div style={{
        height: "100vh",
        background: "linear-gradient(145deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        <Nav phase={phase} />
        <SimulatorView scores={simulatorScores} />
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)",
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <Nav phase={phase} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        {/* Progress bar */}
        <div style={{ maxWidth: 520, width: "100%", margin: "0 auto 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
              {answeredCount} of {totalQuestions}
            </span>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: `linear-gradient(90deg, ${dim.color}, #EC4899)`,
              borderRadius: 99, transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Dimension tabs */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "16px auto 32px", maxWidth: 520 }}>
          {DIMENSIONS.map((d, i) => (
            <div key={d.id} style={{
              width: 36, height: 36, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
              background: i === currentDim ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
              border: i === currentDim ? `2px solid ${d.color}` : "2px solid transparent",
              opacity: i < currentDim ? 0.4 : i === currentDim ? 1 : 0.5,
              transition: "all 0.3s",
            }}>
              {d.icon}
            </div>
          ))}
        </div>

        {/* Question card */}
        <div style={{
          maxWidth: 520, width: "100%", margin: "0 auto", flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 32,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${dim.color}22`, padding: "5px 14px",
              borderRadius: 99, marginBottom: 20,
            }}>
              <span style={{ fontSize: 14 }}>{dim.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: dim.color }}>{dim.label}</span>
            </div>

            <p style={{ fontSize: 20, fontWeight: 600, color: "white", lineHeight: 1.5, marginBottom: 32 }}>
              {dim.questions[currentQ]}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = selectedValue === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 18px", borderRadius: 12,
                      border: isSelected ? `2px solid ${dim.color}` : "2px solid rgba(255,255,255,0.08)",
                      background: isSelected ? `${dim.color}22` : "rgba(255,255,255,0.02)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isSelected ? dim.color : "rgba(255,255,255,0.08)",
                      color: isSelected ? "white" : "#9CA3AF",
                      fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                    }}>
                      {value}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: isSelected ? "white" : "#9CA3AF" }}>
                      {SCALE_LABELS[value - 1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
