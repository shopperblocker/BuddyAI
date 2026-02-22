'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Dimension {
  id: string;
  label: string;
  color: string;
  icon: string;
  description: string;
  questions: string[];
}

interface ScorePayload {
  id: string;
  label: string;
  score: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Answers = Record<number, Record<number, number>>;

interface ShareCardData {
  badge: string;
  message: string;
  score: number | null;
}

interface HistoryRecord {
  scores: ScorePayload[];
  created_at: string;
}

interface InsightData {
  narrative: string | null;
  dimensionInsights: Record<string, string> | null;
  growthFocus: string | null;
  loading: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const DIMENSIONS: Dimension[] = [
  {
    id: 'emotional',
    label: 'Emotional Resilience',
    color: '#6366F1',
    icon: '💜',
    description: 'How you carry the emotional weight of social moments',
    questions: [
      'I can sit with uncomfortable emotions without needing to escape or numb them.',
      'When I feel overwhelmed, I have healthy ways to bring myself back to calm.',
      'I allow myself to feel sadness or grief without judging myself for it.',
      'I recover from emotional setbacks within a reasonable amount of time.',
      'I can express my emotions openly to people I trust.',
    ],
  },
  {
    id: 'anxiety',
    label: 'Anxiety & Mental Clarity',
    color: '#EC4899',
    icon: '🧠',
    description: 'Your experience with social worry, overthinking, and racing thoughts',
    questions: [
      'I am able to quiet my mind when I need to rest or focus.',
      'I don\'t frequently catastrophize or assume the worst outcome.',
      'I feel a general sense of safety in my day-to-day life.',
      'Racing or intrusive thoughts do not dominate my daily experience.',
      'I can make decisions without excessive doubt or second-guessing.',
    ],
  },
  {
    id: 'spiritual',
    label: 'Spiritual Connection',
    color: '#F59E0B',
    icon: '✨',
    description: 'Your sense of inner worth and calm beyond what others think of you',
    questions: [
      'I feel connected to a sense of purpose or meaning in my life.',
      'I engage in practices (prayer, meditation, reflection) that ground me spiritually.',
      'I feel a sense of awe or gratitude on a regular basis.',
      'I trust that there is a larger arc or direction to my life, even during hard times.',
      'I feel aligned between my daily actions and my deeper values or beliefs.',
    ],
  },
  {
    id: 'social',
    label: 'Relational Wellness',
    color: '#10B981',
    icon: '🤝',
    description: 'Your comfort with vulnerability, closeness, and being truly seen',
    questions: [
      'I have at least one person I can be completely honest with about how I\'m feeling.',
      'I set healthy boundaries without guilt in my relationships.',
      'I feel seen and understood by the people closest to me.',
      'I don\'t regularly feel lonely or socially disconnected.',
      'I can navigate conflict in relationships without shutting down or lashing out.',
    ],
  },
  {
    id: 'lifestyle',
    label: 'Body & Lifestyle Balance',
    color: '#0EA5E9',
    icon: '🌿',
    description: 'Daily habits that either fuel or gently quiet your social anxiety',
    questions: [
      'I consistently get enough quality sleep to feel rested.',
      'I move my body in ways that feel good to me on a regular basis.',
      'I nourish myself with food that makes me feel energized, not depleted.',
      'I have a sustainable balance between productivity and rest.',
      'I limit habits I know are harmful to my wellbeing (doomscrolling, substance use, etc).',
    ],
  },
];

const SCALE_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const TOTAL_QUESTIONS = DIMENSIONS.reduce((n, d) => n + d.questions.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 4.0) return { bg: '#DCFCE7', text: '#166534', bar: '#22C55E', label: 'Strong' };
  if (score >= 3.0) return { bg: '#FEF9C3', text: '#854D0E', bar: '#EAB308', label: 'Developing' };
  if (score >= 2.0) return { bg: '#FFEDD5', text: '#9A3412', bar: '#F97316', label: 'Needs Attention' };
  return { bg: '#FEE2E2', text: '#991B1B', bar: '#EF4444', label: 'Priority Area' };
}

function computeScores(answers: Answers): ScorePayload[] {
  return DIMENSIONS.map((dim, di) => {
    const qScores = dim.questions.map((_, qi) => answers[di]?.[qi] || 0);
    const avg = qScores.reduce((a, b) => a + b, 0) / qScores.length;
    return { id: dim.id, label: dim.label, score: Math.round(avg * 10) / 10 };
  });
}

// ── RadarChart ────────────────────────────────────────────────────────────────

function RadarChart({ scores, size = 260 }: { scores: number[]; size?: number }) {
  const center = size / 2;
  const radius = size / 2 - 44;
  const angleStep = (2 * Math.PI) / DIMENSIONS.length;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPoints = DIMENSIONS.map((_, i) => {
    const p = getPoint(i, scores[i]);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levels.map((level) => {
        const pts = DIMENSIONS.map((_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" />;
      })}
      {DIMENSIONS.map((_, i) => {
        const p = getPoint(i, 5);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints} fill="url(#radarFill)" stroke="#2D5BFF" strokeWidth="2" opacity="0.9" />
      {DIMENSIONS.map((dim, i) => {
        const p = getPoint(i, scores[i]);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={dim.color} stroke="white" strokeWidth="2" />;
      })}
      {DIMENSIONS.map((dim, i) => {
        const p = getPoint(i, 6.0);
        const isTop = i === 0;
        const isBottom = i === 2 || i === 3;
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline={isTop ? 'auto' : isBottom ? 'hanging' : 'middle'}
            fontSize="10"
            fontWeight="500"
            fill="#6E6E73"
          >
            {dim.label.split(' ')[0]}
          </text>
        );
      })}
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D5BFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── QuizNav ────────────────────────────────────────────────────────────────────

function QuizNav({ phase }: { phase: string }) {
  const steps = ['Assessment', 'Results', 'Simulator'];
  const phaseToIndex: Record<string, number> = { quiz: 0, results: 1, simulator: 2, voice: 2 };
  const currentIdx = phaseToIndex[phase] ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {steps.map((label, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 99,
                background: isActive ? 'var(--accent-light)' : 'transparent',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 500,
                  background: isActive ? 'var(--accent)' : isDone ? '#22C55E' : 'var(--border)',
                  color: isActive || isDone ? 'white' : 'var(--text-secondary)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isActive ? 'var(--accent)' : isDone ? '#22C55E' : 'var(--text-secondary)',
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 16, height: 1, background: 'var(--border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── ResultsView ───────────────────────────────────────────────────────────────

function ResultsView({
  answers,
  insight,
  onSimulate,
  onVoice,
  onShareCard,
  onDashboard,
}: {
  answers: Answers;
  insight: InsightData;
  onSimulate: (scores: ScorePayload[]) => void;
  onVoice: (scores: ScorePayload[]) => void;
  onShareCard: () => void;
  onDashboard: () => void;
}) {
  const scoresPayload = computeScores(answers);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    fetch('/api/assessment/history')
      .then((r) => r.ok ? r.json() : { history: [] })
      .then((data) => setHistory(data.history ?? []))
      .catch(() => {});
  }, []);

  const overallScore =
    Math.round(
      (scoresPayload.reduce((a, b) => a + b.score, 0) / scoresPayload.length) * 10,
    ) / 10;

  const prevScores = history[0]?.scores;

  const getDelta = (id: string) => {
    if (!prevScores) return null;
    const prev = prevScores.find((s) => s.id === id);
    const curr = scoresPayload.find((s) => s.id === id);
    if (!prev || !curr) return null;
    return Math.round((curr.score - prev.score) * 10) / 10;
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-4) var(--space-3) var(--space-8)' }}>
      {/* Overall */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Your Wellness Profile
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 40, fontWeight: 500, color: 'var(--text)' }}>{overallScore}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>/ 5.0 overall</span>
        </div>
      </div>

      {/* Narrative card */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-3)',
          marginBottom: 'var(--space-2)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--accent)',
        }}
      >
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 500, marginBottom: 10 }}>
          Your insight
        </p>
        {insight.loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.7 }}>
            Generating your personalized insight...
          </p>
        ) : (
          <p style={{ color: 'var(--text)', fontSize: 'var(--text-sm)', lineHeight: 1.8, fontWeight: 400 }}>
            {insight.narrative ?? 'No insight available.'}
          </p>
        )}
      </div>

      {/* Growth focus */}
      {insight.growthFocus && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 'var(--space-3)',
          }}
        >
          <span>→</span>
          <span>This week&apos;s focus: {insight.growthFocus}</span>
        </div>
      )}

      {/* Radar chart */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
        <RadarChart scores={scoresPayload.map((s) => s.score)} size={260} />
      </div>

      {/* Dimension cards 2-column */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {scoresPayload.map(({ id, label, score }) => {
          const dim = DIMENSIONS.find((d) => d.id === id)!;
          const sc = getScoreColor(score);
          const delta = getDelta(id);
          const microInsight = insight.dimensionInsights?.[id];

          return (
            <div
              key={id}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-3)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{dim.icon}</span>
                  <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {delta !== null && (
                    <span style={{ fontSize: 11, color: delta >= 0 ? '#22C55E' : '#EF4444' }}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '3px 8px',
                      borderRadius: 99,
                      background: sc.bg,
                      color: sc.text,
                    }}
                  >
                    {score}
                  </span>
                </div>
              </div>

              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(score / 5) * 100}%`,
                    background: sc.bar,
                    borderRadius: 99,
                    transition: 'width 0.8s var(--ease)',
                  }}
                />
              </div>

              {microInsight ? (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {microInsight}
                </p>
              ) : insight.loading ? (
                <p style={{ fontSize: 12, color: 'var(--border)', lineHeight: 1.6 }}>Loading insight...</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => onSimulate(scoresPayload)}
          style={{
            padding: '13px 32px',
            borderRadius: 'var(--radius-button)',
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
            boxShadow: '0 4px 12px rgba(45,91,255,0.25)',
          }}
        >
          Practice a Real Situation →
        </button>
        <button
          onClick={() => onVoice(scoresPayload)}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-button)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Try Voice Mode
        </button>
        <button
          onClick={onShareCard}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-button)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Generate Share Card
        </button>
        <button
          onClick={onDashboard}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-button)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: 'var(--border)',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ── VoiceView ─────────────────────────────────────────────────────────────────

function VoiceView({
  scores,
  onSimulate,
}: {
  scores: ScorePayload[] | null;
  onSimulate: (scores: ScorePayload[]) => void;
}) {
  const [transcript, setTranscript] = useState('');
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVoiceSubmit = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: transcript,
          scores,
          messages: [{ role: 'user', content: transcript }],
        }),
      });
      const data = await res.json();
      setVoiceReply(data.response);
    } catch {
      setVoiceReply("Couldn't connect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-5) var(--space-3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎙️</div>
        <h2 style={{ color: 'var(--text)', fontSize: 'var(--text-md)', fontWeight: 500, margin: '0 0 8px' }}>
          Voice Mode
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
          Speak or type your thoughts — BuddyAI responds with guided coaching.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-3)',
          border: '1px solid var(--border)',
          marginBottom: 12,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Your message
        </p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type or paste what you want to say aloud..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            boxSizing: 'border-box',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 'var(--text-xs)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        onClick={handleVoiceSubmit}
        disabled={!transcript.trim() || loading}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 'var(--radius-button)',
          border: 'none',
          background: transcript.trim() && !loading ? 'var(--accent)' : 'var(--border)',
          color: transcript.trim() && !loading ? 'white' : 'var(--text-secondary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          cursor: transcript.trim() && !loading ? 'pointer' : 'not-allowed',
          marginBottom: 16,
        }}
      >
        {loading ? 'Processing...' : 'Send →'}
      </button>

      {voiceReply && (
        <div
          style={{
            background: 'var(--accent-light)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-3)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 500, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            BuddyAI Response
          </p>
          <p style={{ color: 'var(--text)', fontSize: 'var(--text-xs)', lineHeight: 1.7, margin: '0 0 16px' }}>{voiceReply}</p>
          <button
            onClick={() => scores && onSimulate(scores)}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Continue in Simulator →
          </button>
        </div>
      )}
    </div>
  );
}

// ── SimulatorView ─────────────────────────────────────────────────────────────

function SimulatorView({ scores }: { scores: ScorePayload[] | null }) {
  const [situation, setSituation] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const MAX_TURNS = 6;

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (content: string) => {
    if (loading || userTurnCount >= MAX_TURNS) return;
    const updated: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, scores, messages: updated }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I had trouble connecting. Please try again.' },
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
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-5) var(--space-3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎭</div>
          <h2 style={{ color: 'var(--text)', fontSize: 'var(--text-md)', fontWeight: 500, margin: '0 0 8px' }}>
            Practice a Real Situation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Tell BuddyAI what social situation you&apos;re dreading. It&apos;ll coach you through it like a calm, trusted friend.
          </p>
        </div>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="e.g. I have a job interview tomorrow, I need to speak up in a meeting..."
          rows={4}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-card)',
            boxSizing: 'border-box',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.7,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
        <button
          onClick={handleStart}
          disabled={!situation.trim()}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '13px',
            borderRadius: 'var(--radius-button)',
            border: 'none',
            background: situation.trim() ? 'var(--accent)' : 'var(--border)',
            color: situation.trim() ? 'white' : 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: situation.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Start Practice Session →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '0 var(--space-3) var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          margin: '14px 0 8px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Practicing for
        </p>
        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, fontWeight: 500 }}>{situation}</p>
      </div>

      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {Math.max(0, MAX_TURNS - userTurnCount)} turns remaining
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '82%',
                padding: '11px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.6,
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {msg.role === 'assistant' && (
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BuddyAI
                </span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '11px 14px', borderRadius: '14px 14px 14px 4px', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BuddyAI</span>
              thinking...
            </div>
          </div>
        )}
        {userTurnCount >= MAX_TURNS && !loading && (
          <div style={{ textAlign: 'center', padding: 14, borderRadius: 'var(--radius-card)', background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '0 0 4px' }}>Session complete</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>You&apos;ve completed 6 turns. You&apos;ve got this.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {userTurnCount < MAX_TURNS && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim() && !loading) {
                e.preventDefault();
                send(input.trim());
              }
            }}
            placeholder="Reply to BuddyAI..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 'var(--radius-button)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 'var(--text-xs)',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          <button
            onClick={() => input.trim() && !loading && send(input.trim())}
            disabled={loading || !input.trim()}
            style={{
              padding: '11px 16px',
              borderRadius: 'var(--radius-button)',
              border: 'none',
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
              color: input.trim() && !loading ? 'white' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: 16,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ── ShareCardModal ────────────────────────────────────────────────────────────

function ShareCardModal({ card, onClose }: { card: ShareCardData; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-4)',
          maxWidth: 380,
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🫂</div>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, margin: '0 0 8px', color: 'var(--text)' }}>
            BuddyAI Wellness Card
          </h2>
          <div
            style={{
              display: 'inline-block',
              fontSize: 20,
              marginBottom: 8,
              padding: '8px 20px',
              borderRadius: 99,
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            {card.badge}
          </div>
          {card.score !== null && (
            <p style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 500, margin: '8px 0 0' }}>
              {card.score} / 5.0 overall
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: '12px 0 0' }}>
            {card.message}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-button)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── DiagnosticApp (main) ──────────────────────────────────────────────────────

export default function DiagnosticApp() {
  const { data: session } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState('intro');
  const [currentDim, setCurrentDim] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [simulatorScores, setSimulatorScores] = useState<ScorePayload[] | null>(null);
  const [shareCard, setShareCard] = useState<ShareCardData | null>(null);
  const [insight, setInsight] = useState<InsightData>({
    narrative: null,
    dimensionInsights: null,
    growthFocus: null,
    loading: false,
  });
  const transitioningRef = useRef(false);

  const answeredCount = currentDim * 5 + currentQ;
  const progress = (answeredCount / TOTAL_QUESTIONS) * 100;

  const submitAssessment = async (scores: ScorePayload[]) => {
    setInsight((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, userId: session?.user?.id }),
      });
      const data = await res.json();
      setInsight({
        narrative: data.narrative ?? null,
        dimensionInsights: data.dimension_insights ?? null,
        growthFocus: data.growth_focus ?? null,
        loading: false,
      });
    } catch {
      setInsight({
        narrative: "We couldn't generate your insight right now. Try refreshing.",
        dimensionInsights: null,
        growthFocus: null,
        loading: false,
      });
    }
  };

  const handleAnswer = (value: number) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setSelectedValue(value);

    setTimeout(() => {
      const newAnswers: Answers = {
        ...answers,
        [currentDim]: { ...answers[currentDim], [currentQ]: value },
      };
      setAnswers(newAnswers);
      setSelectedValue(null);
      transitioningRef.current = false;

      if (currentQ < DIMENSIONS[currentDim].questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else if (currentDim < DIMENSIONS.length - 1) {
        setCurrentDim(currentDim + 1);
        setCurrentQ(0);
      } else {
        const scores = computeScores(newAnswers);
        submitAssessment(scores);
        setPhase('results');
      }
    }, 300);
  };

  const handleSimulate = (scores: ScorePayload[]) => {
    setSimulatorScores(scores);
    setPhase('simulator');
  };

  const handleVoice = (scores: ScorePayload[]) => {
    setSimulatorScores(scores);
    setPhase('voice');
  };

  const handleShareCard = async () => {
    try {
      const res = await fetch('/api/share-card');
      const data = await res.json();
      setShareCard({ badge: data.card.badge, message: data.card.message, score: data.card.overall_score });
    } catch {
      setShareCard({ badge: '🌱 Starting Strong', message: 'Keep going — every step counts.', score: null });
    }
  };

  const resetApp = () => {
    setPhase('intro');
    setCurrentDim(0);
    setCurrentQ(0);
    setAnswers({});
    setSimulatorScores(null);
    setInsight({ narrative: null, dimensionInsights: null, growthFocus: null, loading: false });
  };

  const dim = DIMENSIONS[currentDim];

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-3)',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-2)' }}>🫂</div>
          <h1
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            BuddyAI
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.7,
              marginBottom: 'var(--space-4)',
            }}
          >
            25 honest questions to understand where your anxiety lives — and a coach to help you face it.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            {DIMENSIONS.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-xs)', color: 'var(--text)', margin: 0 }}>{d.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{d.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('quiz')}
            style={{
              width: '100%',
              padding: '14px 32px',
              borderRadius: 'var(--radius-button)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(45,91,255,0.25)',
            }}
          >
            Begin Assessment →
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 10 }}>Takes about 3–5 minutes</p>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
        <QuizNav phase={phase} />
        <ResultsView
          answers={answers}
          insight={insight}
          onSimulate={handleSimulate}
          onVoice={handleVoice}
          onShareCard={handleShareCard}
          onDashboard={() => router.push('/dashboard')}
        />
        <div style={{ textAlign: 'center', paddingBottom: 'var(--space-5)' }}>
          <button
            onClick={resetApp}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-button)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            ↻ Retake Assessment
          </button>
        </div>
        {shareCard && <ShareCardModal card={shareCard} onClose={() => setShareCard(null)} />}
      </div>
    );
  }

  // ── Voice ──────────────────────────────────────────────────────────────────
  if (phase === 'voice') {
    return (
      <div style={{ height: '100vh', background: 'var(--bg)', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
        <QuizNav phase={phase} />
        <VoiceView scores={simulatorScores} onSimulate={handleSimulate} />
        {shareCard && <ShareCardModal card={shareCard} onClose={() => setShareCard(null)} />}
      </div>
    );
  }

  // ── Simulator ──────────────────────────────────────────────────────────────
  if (phase === 'simulator') {
    return (
      <div style={{ height: '100vh', background: 'var(--bg)', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
        <QuizNav phase={phase} />
        <SimulatorView scores={simulatorScores} />
        {shareCard && <ShareCardModal card={shareCard} onClose={() => setShareCard(null)} />}
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
      <QuizNav phase={phase} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-3)' }}>
        {/* Progress bar */}
        <div style={{ maxWidth: 520, width: '100%', margin: '0 auto var(--space-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {answeredCount} of {TOTAL_QUESTIONS}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 99 }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                borderRadius: 99,
                transition: 'width var(--duration-normal) var(--ease)',
              }}
            />
          </div>
        </div>

        {/* Dimension tabs */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '14px auto var(--space-4)', maxWidth: 520 }}>
          {DIMENSIONS.map((d, i) => (
            <div
              key={d.id}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                background: i === currentDim ? 'var(--accent-light)' : i < currentDim ? '#F0FDF4' : 'var(--surface)',
                border: i === currentDim ? `2px solid var(--accent)` : i < currentDim ? '2px solid #22C55E' : '2px solid var(--border)',
                opacity: i > currentDim ? 0.5 : 1,
                transition: 'all var(--duration-normal) var(--ease)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {i < currentDim ? '✓' : d.icon}
            </div>
          ))}
        </div>

        {/* Question card */}
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-4)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent-light)',
                padding: '5px 12px',
                borderRadius: 99,
                marginBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontSize: 13 }}>{dim.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>{dim.label}</span>
            </div>

            <p
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text)',
                lineHeight: 1.5,
                marginBottom: 'var(--space-3)',
              }}
            >
              {dim.questions[currentQ]}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = selectedValue === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '13px 16px',
                      borderRadius: 'var(--radius-button)',
                      border: isSelected ? `2px solid var(--accent)` : '2px solid var(--border)',
                      background: isSelected ? 'var(--accent-light)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? 'var(--accent)' : 'var(--bg)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        fontWeight: 500,
                        fontSize: 13,
                        transition: 'all var(--duration-fast) var(--ease)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {value}
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? 'var(--accent)' : 'var(--text)',
                      }}
                    >
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
