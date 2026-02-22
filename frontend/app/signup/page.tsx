'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign in after signup
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Account created — please sign in.');
        router.push('/signin');
      } else {
        router.push('/onboarding');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-button)' as string,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 'var(--text-xs)' as string,
    outline: 'none' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color var(--duration-fast) var(--ease)',
  };

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
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🫂</div>
          <h1
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 6,
            }}
          >
            Create your account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            Free to start. No credit card required.
          </p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Your name', value: name, setter: setName, type: 'text', placeholder: 'Alex', required: true },
              { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@example.com', required: true },
              { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '8+ characters', required: true },
              { label: 'Referral code (optional)', value: referralCode, setter: setReferralCode, type: 'text', placeholder: 'BUDDY-XXXX', required: false },
            ].map(({ label, value, setter, type, placeholder, required }) => (
              <div key={label}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

            {error && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: loading ? 'var(--text-secondary)' : 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background var(--duration-fast) var(--ease)',
              }}
            >
              {loading ? 'Creating account...' : 'Start free →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          Already have an account?{' '}
          <Link
            href="/signin"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
