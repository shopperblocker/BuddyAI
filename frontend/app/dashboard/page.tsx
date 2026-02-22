'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

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

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  hard: { bg: '#FEE2E2', text: '#991B1B' },
};

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
    const dateStr = d.toISOString().split('T')[0];
    return dateStr === lastCompletedDate;
  });
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const [challengeRes, streakRes] = await Promise.all([
      fetch(`/api/challenge/today?date=${today}`),
      fetch('/api/streak'),
    ]);

    if (challengeRes.ok) {
      const data = await challengeRes.json();
      setChallenge(data);
    }
    if (streakRes.ok) {
      const data = await streakRes.json();
      setStreak(data);
    }
    setChallengeLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
    if (status === 'authenticated') loadData();
  }, [status, router, loadData]);

  const handleComplete = async () => {
    if (completing || challenge?.completed || justCompleted) return;
    setCompleting(true);

    // Optimistic update
    setChallenge((prev) => (prev ? { ...prev, completed: true } : prev));
    setStreak((prev) =>
      prev
        ? {
            ...prev,
            current_streak: prev.current_streak + 1,
            total_completions: prev.total_completions + 1,
          }
        : prev,
    );

    try {
      const res = await fetch('/api/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeType: 'challenge',
          challengeText: challenge?.challenge.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streak) setStreak(data.streak);
        setJustCompleted(true);
      }
    } catch {
      // Keep optimistic state
    }
    setCompleting(false);
  };

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
      <Nav />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4) var(--space-3) var(--space-10)' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
            {getGreeting(session?.user?.name)} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            {isCompleted
              ? "You've completed today's challenge. Keep the momentum going."
              : "Let's keep the momentum going."}
          </p>
        </div>

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          </div>

          {/* Week dots */}
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
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            Today&apos;s Challenge
          </p>

          {challengeLoading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Generating your challenge...</p>
          ) : challenge ? (
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
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
              marginBottom: 'var(--space-3)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
              Comfort zone
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text)', lineHeight: 1.7 }}>
              {challenge.comfort_zone}
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => router.push('/assessment')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-button)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(45,91,255,0.2)',
              textAlign: 'center',
            }}
          >
            Take Assessment →
          </button>
          <button
            onClick={() => router.push('/assessment')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-button)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center',
            }}
          >
            Practice a Situation
          </button>
        </div>
      </div>
    </div>
  );
}
