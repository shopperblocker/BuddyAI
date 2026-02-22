'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? 'Registration failed');
      router.push('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif", padding: 24,
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🫂</div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, marginBottom: 8,
          background: 'linear-gradient(135deg, #A78BFA, #EC4899, #F59E0B)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>BuddyAI</h1>
        <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Your personal social anxiety companion.<br />Let&apos;s get you set up.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" required autoFocus
            style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
          />
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            type="email" placeholder="Email address" required
            style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
          />
          {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{
              padding: '14px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366F1, #EC4899)',
              color: loading ? '#6B7280' : 'white',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
            }}
          >
            {loading ? 'Creating account...' : 'Get Started →'}
          </button>
        </form>

        <p style={{ color: '#6B7280', fontSize: 12, marginTop: 20 }}>
          Returning user?{' '}
          <a href="/assessment" style={{ color: '#A78BFA', textDecoration: 'none' }}>Skip to assessment</a>
        </p>
      </div>
    </div>
  );
}
