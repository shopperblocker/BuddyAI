'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import SimulatorView from '@/components/SimulatorView';
import EmergencyModal from '@/components/EmergencyModal';
import { getDailyQuestions, DailyQuestion } from '@/lib/daily-questions';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Challenge {
  affirmation: string;
  challenge: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  comfort_zone: string;
  completed: boolean;
  date: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completions: number;
}

interface ScorePayload {
  id: string;
  label: string;
  score: number;
}

interface HistoryRecord {
  scores: ScorePayload[];
  created_at: string;
}

interface LatestInsight {
  narrative: string | null;
  growthFocus: string | null;
  dimensionInsights: Record<string, string> | null;
}

type Tab = 'today' | 'practice' | 'history';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  hard: { bg: '#FEE2E2', text: '#991B1B' },
};

function getScoreColor(score: number) {
  if (score >= 4.0) return { bg: '#DCFCE7', text: '#166534', bar: '#22C55E', label: 'Strong' };
  if (score >= 3.0) return { bg: '#FEF9C3', text: '#854D0E', bar: '#EAB308', label: 'Developing' };
  if (score >= 2.0) return { bg: '#FFEDD5', text: '#9A3412', bar: '#F97316', label: 'Needs Attention' };
  return { bg: '#FEE2E2', text: '#991B1B', bar: '#EF4444', label: 'Priority Area' };
}

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${time}, ${name ?? 'there'}`;
}

function getWeekDots(lastCompletedDate: string | null): boolean[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0] === lastCompletedDate;
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showEmergency, setShowEmergency] = useState(false);

  // Today tab data
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Daily check-in
  const [checkinAnswers, setCheckinAnswers] = useState<Record<string, number>>({});
  const [checkinSubmitted, setCheckinSubmitted] = useState(false);
  const [checkinSummary, setCheckinSummary] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // History tab data
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [latestInsight, setLatestInsight] = useState<LatestInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const dailyQuestions = getDailyQuestions();
  const latestScores = history[0]?.scores ?? null;

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const [challengeRes, streakRes, historyRes] = await Promise.all([
      fetch(`/api/challenge/today?date=${today}`),
      fetch('/api/streak'),
      fetch('/api/assessment/history'),
    ]);
    if (challengeRes.ok) setChallenge(await challengeRes.json());
    if (streakRes.ok) setStreak(await streakRes.json());
    if (historyRes.ok) {
      const data = await historyRes.json();
      setHistory(data.history ?? []);
    }
    setChallengeLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
    if (status === 'authenticated') loadData();
  }, [status, router, loadData]);

  // Load insight when History tab opens for first time
  useEffect(() => {
    if (activeTab !== 'history' || latestInsight || insightLoading || !latestScores) return;
    setInsightLoading(true);
    fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: latestScores }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, unknown>) => {
        setLatestInsight({
          narrative: (data.narrative as string) ?? null,
          growthFocus: (data.growth_focus as string) ?? null,
          dimensionInsights: (data.dimension_insights as Record<string, string>) ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setInsightLoading(false));
  }, [activeTab, latestInsight, insightLoading, latestScores]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (completing || challenge?.completed || justCompleted) return;
    setCompleting(true);
    setChallenge((prev) => (prev ? { ...prev, completed: true } : prev));
    setStreak((prev) =>
      prev
        ? { ...prev, current_streak: prev.current_streak + 1, total_completions: prev.total_completions + 1 }
        : prev,
    );
    try {
      const res = await fetch('/api/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeType: 'challenge', challengeText: challenge?.challenge.title }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streak) setStreak(data.streak);
        setJustCompleted(true);
      }
    } catch { /* keep optimistic state */ }
    setCompleting(false);
  };

  const handleCheckinAnswer = (questionId: string, value: number) => {
    setCheckinAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckinSubmit = async () => {
    const allAnswered = dailyQuestions.every((q) => checkinAnswers[q.id] !== undefined);
    if (!allAnswered || checkinLoading) return;
    setCheckinLoading(true);
    const scores = dailyQuestions.map((q) => ({
      id: q.dimensionId,
      label: q.dimensionLabel,
      score: checkinAnswers[q.id],
    }));
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });
      const data = await res.json();
      setCheckinSummary(data.narrative ?? 'Great check-in — keep building momentum.');
      setCheckinSubmitted(true);
      // Refresh history to include this check-in
      const histRes = await fetch('/api/assessment/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.history ?? []);
      }
    } catch {
      setCheckinSummary('Check-in saved. Keep going!');
      setCheckinSubmitted(true);
    }
    setCheckinLoading(false);
  };

  // ── Loading / unauth ─────────────────────────────────────────────────────────

  if (status === 'loading' || (status === 'authenticated' && challengeLoading)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Loading...</p>
      </div>
    );
  }
  if (status === 'unauthenticated') return null;

  const weekDots = getWeekDots(streak?.last_completed_date ?? null);
  const isCompleted = challenge?.completed || justCompleted;
  const allCheckinAnswered = dailyQuestions.every((q) => checkinAnswers[q.id] !== undefined);

  // ── Sidebar nav items ─────────────────────────────────────────────────────────

  const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '🏠' },
    { id: 'practice', label: 'Practice', icon: '🎭' },
    { id: 'history', label: 'History', icon: '📊' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
      <Nav />

      <div
        style={{
          display: 'flex',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 var(--space-3)',
          alignItems: 'flex-start',
        }}
      >
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            position: 'sticky',
            top: 56,
            height: 'calc(100vh - 56px)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'var(--space-4)',
            paddingRight: 'var(--space-2)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          {/* User greeting */}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', paddingLeft: 14 }}>
            {getGreeting(session?.user?.name)} 👋
          </p>

          {/* Nav buttons */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: activeTab === id ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === id ? 'var(--accent)' : 'var(--text)',
                  fontWeight: activeTab === id ? 500 : 400,
                  fontSize: 'var(--text-xs)',
                  transition: 'background var(--duration-fast) var(--ease)',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          {/* Divider + Emergency */}
          <div>
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
            <button
              onClick={() => setShowEmergency(true)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#FEE2E2',
                color: '#991B1B',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'background var(--duration-fast) var(--ease)',
              }}
            >
              <span style={{ fontSize: 16 }}>🆘</span>
              Emergency
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: 'var(--space-4) 0 var(--space-10) var(--space-3)',
            borderLeft: '1px solid var(--border)',
          }}
        >
          {/* ── Today tab ────────────────────────────────────────────────── */}
          {activeTab === 'today' && (
            <div style={{ maxWidth: 560 }}>
              {/* Streak card */}
              <div
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-2)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>🔥</span>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>
                      {streak?.current_streak ?? 0}-day streak
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Best: {streak?.longest_streak ?? 0} days · {streak?.total_completions ?? 0} total
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {weekDots.map((filled, i) => (
                    <div
                      key={i}
                      className={`streak-dot ${filled || (i === 6 && isCompleted) ? 'filled' : 'empty'}`}
                      title={`Day ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Daily check-in */}
              {checkinSubmitted ? (
                <div
                  style={{
                    background: 'var(--accent-light)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 500, marginBottom: 8 }}>
                    Daily check-in complete ✓
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text)', lineHeight: 1.7 }}>
                    {checkinSummary ?? 'Thanks for checking in today.'}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                    Daily check-in
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {dailyQuestions.map((q: DailyQuestion) => (
                      <div key={q.id}>
                        <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>
                          <span style={{ marginRight: 6 }}>{q.dimensionIcon}</span>
                          {q.text}
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={() => handleCheckinAnswer(q.id, v)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 'var(--radius-sm)',
                                border: checkinAnswers[q.id] === v ? '2px solid var(--accent)' : '2px solid var(--border)',
                                background: checkinAnswers[q.id] === v ? 'var(--accent-light)' : 'var(--bg)',
                                color: checkinAnswers[q.id] === v ? 'var(--accent)' : 'var(--text)',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all var(--duration-fast) var(--ease)',
                                fontFamily: 'inherit',
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCheckinSubmit}
                    disabled={!allCheckinAnswered || checkinLoading}
                    style={{
                      marginTop: 16,
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-button)',
                      border: 'none',
                      background: allCheckinAnswered && !checkinLoading ? 'var(--accent)' : 'var(--border)',
                      color: allCheckinAnswered && !checkinLoading ? 'white' : 'var(--text-secondary)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      cursor: allCheckinAnswered && !checkinLoading ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    {checkinLoading ? 'Submitting...' : 'Submit check-in'}
                  </button>
                </div>
              )}

              {/* Daily Challenge */}
              <div
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-2)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                  Today&apos;s Challenge
                </p>
                {challenge ? (
                  <>
                    <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>
                      {challenge.challenge.title}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.7, marginBottom: 14 }}>
                      {challenge.challenge.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '4px 10px',
                          borderRadius: 99,
                          background: DIFFICULTY_COLORS[challenge.challenge.difficulty]?.bg ?? '#F3F4F6',
                          color: DIFFICULTY_COLORS[challenge.challenge.difficulty]?.text ?? '#374151',
                          textTransform: 'capitalize',
                        }}
                      >
                        {challenge.challenge.difficulty}
                      </span>
                      <button
                        onClick={handleComplete}
                        disabled={isCompleted || completing}
                        className={justCompleted ? 'pop-in' : ''}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-button)',
                          border: 'none',
                          background: isCompleted ? '#22C55E' : 'var(--accent)',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: isCompleted ? 'default' : 'pointer',
                          transition: 'background var(--duration-normal) var(--ease)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {isCompleted ? '✓ Done!' : completing ? 'Marking...' : 'Mark Complete'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    Complete your first assessment to unlock personalized challenges.
                  </p>
                )}
              </div>

              {/* Affirmation */}
              {challenge?.affirmation && (
                <div
                  style={{
                    background: 'var(--accent-light)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 500, marginBottom: 8 }}>
                    💡 Today&apos;s affirmation
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.7, fontWeight: 400 }}>
                    &ldquo;{challenge.affirmation}&rdquo;
                  </p>
                </div>
              )}

              {/* Comfort zone */}
              {challenge?.comfort_zone && (
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
                    Comfort zone
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text)', lineHeight: 1.7 }}>{challenge.comfort_zone}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Practice tab ─────────────────────────────────────────────── */}
          {activeTab === 'practice' && (
            <SimulatorView scores={latestScores} />
          )}

          {/* ── History tab ──────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div style={{ maxWidth: 620 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                  Assessment History
                </h2>
                <button
                  onClick={() => router.push('/assessment')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-button)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(45,91,255,0.2)',
                  }}
                >
                  Take Full Assessment →
                </button>
              </div>

              {history.length === 0 ? (
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-5)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
                  <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 6 }}>No assessments yet</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Take your first assessment to start tracking your wellness journey.
                  </p>
                </div>
              ) : (
                <>
                  {/* Assessment cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    {history.map((record, idx) => {
                      const overallScore = Math.round((record.scores.reduce((a, b) => a + b.score, 0) / record.scores.length) * 10) / 10;
                      const sc = getScoreColor(overallScore);
                      const date = new Date(record.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      });
                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--surface)',
                            borderRadius: 'var(--radius-card)',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                              <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                                {idx === 0 ? 'Most recent' : `${idx + 1} sessions ago`}
                              </p>
                              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, margin: 0 }}>{date}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{overallScore}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> / 5</span>
                              <div>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 500 }}>
                                  {sc.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Dimension bars */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {record.scores.map(({ id, label, score }) => {
                              const dsc = getScoreColor(score);
                              return (
                                <div key={id}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{score}</span>
                                  </div>
                                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: dsc.bar, borderRadius: 99, transition: 'width 0.8s var(--ease)' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actionable steps */}
                  <div
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-card)',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                      Current actionable steps
                    </p>
                    {insightLoading ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Generating your insights...</p>
                    ) : latestInsight ? (
                      <div>
                        {latestInsight.growthFocus && (
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
                              marginBottom: 'var(--space-2)',
                            }}
                          >
                            <span>→</span>
                            <span>Focus: {latestInsight.growthFocus}</span>
                          </div>
                        )}
                        {latestInsight.narrative && (
                          <p style={{ color: 'var(--text)', fontSize: 'var(--text-xs)', lineHeight: 1.8, marginBottom: 'var(--space-2)' }}>
                            {latestInsight.narrative}
                          </p>
                        )}
                        {latestInsight.dimensionInsights && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Object.entries(latestInsight.dimensionInsights).map(([key, text]) => (
                              <div
                                key={key}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                <p style={{ fontSize: 11, textTransform: 'capitalize', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
                                  {key}
                                </p>
                                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Insights will appear here.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Emergency modal */}
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </div>
  );
}
