'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  lastActive: string;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  flagged: boolean;
  dimensions: Record<string, number>;
}

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'usr_1', name: 'Alex M.', lastActive: '2h ago', overallScore: 3.2,
    trend: 'improving', flagged: false,
    dimensions: { Emotional: 3.4, Anxiety: 2.8, Spiritual: 3.6, Social: 3.0, Lifestyle: 3.2 },
  },
  {
    id: 'usr_2', name: 'Jordan K.', lastActive: '1d ago', overallScore: 1.8,
    trend: 'declining', flagged: true,
    dimensions: { Emotional: 1.6, Anxiety: 1.4, Spiritual: 2.2, Social: 1.8, Lifestyle: 2.0 },
  },
  {
    id: 'usr_3', name: 'Sam T.', lastActive: '3h ago', overallScore: 4.1,
    trend: 'stable', flagged: false,
    dimensions: { Emotional: 4.2, Anxiety: 3.8, Spiritual: 4.4, Social: 4.0, Lifestyle: 4.0 },
  },
  {
    id: 'usr_4', name: 'Riley P.', lastActive: '5d ago', overallScore: 2.6,
    trend: 'improving', flagged: true,
    dimensions: { Emotional: 2.4, Anxiety: 2.2, Spiritual: 3.0, Social: 2.8, Lifestyle: 2.6 },
  },
];

function scoreStyle(score: number) {
  if (score >= 4) return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
  if (score >= 3) return { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' };
  if (score >= 2) return { bg: '#FFEDD5', text: '#9A3412', dot: '#F97316' };
  return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
}

function ScoreBadge({ score }: { score: number }) {
  const s = scoreStyle(score);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.text,
      fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {score.toFixed(1)}
    </span>
  );
}

export default function ClinicianDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const patient = MOCK_PATIENTS.find(p => p.id === selectedId) ?? null;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid #F3F4F6',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🫂</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1F2937' }}>BuddyAI</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Clinician insight dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>Live • {MOCK_PATIENTS.length} patients</span>
          </div>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Patient list */}
        <div style={{ width: 320, borderRight: '1px solid #F3F4F6', background: 'white', overflowY: 'auto' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>
              Patients
            </p>
          </div>
          {MOCK_PATIENTS.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                padding: '16px 20px', cursor: 'pointer',
                borderBottom: '1px solid #F9FAFB',
                background: selectedId === p.id ? '#F5F3FF' : 'white',
                borderLeft: selectedId === p.id ? '3px solid #6366F1' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.flagged && <span style={{ fontSize: 13 }}>🚩</span>}
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>{p.name}</span>
                </div>
                <ScoreBadge score={p.overallScore} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Active {p.lastActive}</span>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: p.trend === 'improving' ? '#10B981' : p.trend === 'declining' ? '#EF4444' : '#9CA3AF',
                }}>
                  {p.trend === 'improving' ? '↑ Improving' : p.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {!patient ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
              <span style={{ fontSize: 40, marginBottom: 16 }}>👈</span>
              <p style={{ fontSize: 15 }}>Select a patient to view their profile</p>
            </div>
          ) : (
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1F2937' }}>{patient.name}</h2>
                {patient.flagged && (
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
                    Needs Attention
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {Object.entries(patient.dimensions).map(([dim, score]) => (
                  <div key={dim} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #F3F4F6' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9CA3AF', textTransform: 'capitalize', fontWeight: 500 }}>
                      {dim}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ScoreBadge score={score} />
                      <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: '#6366F1', borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #F3F4F6' }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#1F2937', marginBottom: 8 }}>Session Notes</p>
                <textarea
                  placeholder="Add clinical notes..."
                  rows={4}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 8,
                    border: '1px solid #E5E7EB', fontSize: 14, color: '#374151',
                    resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
