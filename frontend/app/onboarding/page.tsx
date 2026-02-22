'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  {
    id: 'mood',
    question: 'How are you feeling overall right now?',
    options: ['Really struggling', 'A bit off', 'Okay', 'Pretty good', 'Great'],
  },
  {
    id: 'anxiety',
    question: 'How is your social anxiety today?',
    options: ['Very high', 'High', 'Moderate', 'Low', 'Barely there'],
  },
  {
    id: 'avoidance',
    question: 'Have you avoided any social situations today?',
    options: ['Multiple times', 'Once', 'Almost but did not', 'No', 'I faced a fear'],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checkInAnswers, setCheckInAnswers] = useState<Record<string, string>>({});
  const q = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  const handleSelect = (opt: string) => {
    const updated = { ...checkInAnswers, [q.id]: opt };
    setCheckInAnswers(updated);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('buddy_checkin', JSON.stringify(updated));
      router.push('/assessment');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            Daily Check-in
          </p>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>
            How are you doing today?
          </h2>
        </div>

        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, marginBottom: 32 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366F1, #EC4899)',
            borderRadius: 99, transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 32,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ color: 'white', fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
            {q.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 18px', borderRadius: 12,
                  border: '2px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', color: '#9CA3AF', fontSize: 14,
                  fontWeight: 500, textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.08)', color: '#6B7280',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {i + 1}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <p style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Question {step + 1} of {QUESTIONS.length}
        </p>
      </div>
    </div>
  );
}
