import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import AnimateIn from '@/components/AnimateIn';

const DIMENSIONS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#2D5BFF" strokeWidth="2" />
        <circle cx="14" cy="14" r="4" fill="#2D5BFF" />
      </svg>
    ),
    label: 'Emotional Resilience',
    desc: 'How you carry the weight of social moments and recover from them.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="4" stroke="#2D5BFF" strokeWidth="2" />
        <rect x="10" y="10" width="8" height="8" fill="#2D5BFF" />
      </svg>
    ),
    label: 'Anxiety & Mental Clarity',
    desc: 'Your experience with social worry, overthinking, and racing thoughts.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <polygon points="14,3 25,24 3,24" stroke="#2D5BFF" strokeWidth="2" fill="none" />
        <polygon points="14,11 19,20 9,20" fill="#2D5BFF" />
      </svg>
    ),
    label: 'Spiritual Connection',
    desc: 'Your sense of inner worth and calm beyond what others think of you.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4 L24 10 L24 22 L4 22 L4 10 Z" stroke="#2D5BFF" strokeWidth="2" fill="none" />
        <circle cx="14" cy="15" r="3" fill="#2D5BFF" />
      </svg>
    ),
    label: 'Relational Wellness',
    desc: 'Your comfort with vulnerability, closeness, and being truly seen.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4 C14 4 4 10 4 18 C4 22 8.5 25 14 25 C19.5 25 24 22 24 18 C24 10 14 4 14 4Z"
          stroke="#2D5BFF" strokeWidth="2" fill="none" />
        <ellipse cx="14" cy="18" rx="4" ry="3" fill="#2D5BFF" />
      </svg>
    ),
    label: 'Body & Lifestyle',
    desc: 'Daily habits that either fuel or gently quiet your social anxiety.',
  },
];

const MOCK_SCORES = [
  { label: 'Emotional Resilience', score: 3.8, color: '#22C55E' },
  { label: 'Anxiety & Mental Clarity', score: 2.6, color: '#F97316' },
  { label: 'Spiritual Connection', score: 4.2, color: '#22C55E' },
  { label: 'Relational Wellness', score: 3.1, color: '#EAB308' },
  { label: 'Body & Lifestyle', score: 3.5, color: '#EAB308' },
];

export default async function Home() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
        }}
      >
        <div
          className="hero-enter"
          style={{ animationDelay: '0ms', maxWidth: 640 }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 14px',
              borderRadius: 99,
              marginBottom: 'var(--space-3)',
              letterSpacing: '0.04em',
            }}
          >
            Social anxiety companion
          </div>
        </div>

        <h1
          className="hero-enter"
          style={{
            fontSize: 'clamp(40px, 7vw, var(--text-6xl))',
            fontWeight: 500,
            lineHeight: 1.1,
            color: 'var(--text)',
            marginBottom: 'var(--space-3)',
            animationDelay: '80ms',
            maxWidth: 640,
          }}
        >
          Face social anxiety
          <br />
          <span style={{ color: 'var(--accent)' }}>head-on.</span>
        </h1>

        <p
          className="hero-enter"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: 480,
            marginBottom: 'var(--space-5)',
            animationDelay: '160ms',
          }}
        >
          Assess where your anxiety lives across five dimensions, get AI-powered insights, and practice real situations — privately, at your own pace.
        </p>

        <div
          className="hero-enter"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            animationDelay: '240ms',
          }}
        >
          <Link
            href="/signup"
            style={{
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: 'var(--radius-button)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(45,91,255,0.3)',
              transition: 'opacity var(--duration-fast) var(--ease)',
            }}
          >
            Start Free →
          </Link>
          <a
            href="#dimensions"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: 'var(--radius-button)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── Five Dimensions ────────────────────────────────────────── */}
      <section
        id="dimensions"
        style={{
          padding: 'var(--space-10) var(--space-3)',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <AnimateIn style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <p
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              marginBottom: 12,
            }}
          >
            Five dimensions
          </p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 500,
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            Understand where you actually stand
          </h2>
        </AnimateIn>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-2)',
          }}
        >
          {DIMENSIONS.map((d, i) => (
            <AnimateIn key={d.label} delay={i * 80}>
              <div classname="hoverShadowCard"
            
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  padding: 'var(--space-3)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                  height: '100%',
                  transition: 'box-shadow var(--duration-normal) var(--ease)',
                }}
              >
                <div style={{ marginBottom: 12 }}>{d.icon}</div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 6,
                  }}
                >
                  {d.label}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {d.desc}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── Dashboard Preview ──────────────────────────────────────── */}
      <section
        style={{
          padding: 'var(--space-10) var(--space-3)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <AnimateIn style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
            <p
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                marginBottom: 12,
              }}
            >
              Your results
            </p>
            <h2
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              Scores that actually mean something
            </h2>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-3)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Your wellness profile — preview
              </p>

              {MOCK_SCORES.map((s) => (
                <div key={s.label} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: s.color,
                      }}
                    >
                      {s.score}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'var(--border)',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(s.score / 5) * 100}%`,
                        background: s.color,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  background: 'var(--accent-light)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                  &ldquo;You process emotions well on your own, but social situations drain you faster than most. Your spiritual grounding is a real strength to build from.&rdquo;
                </p>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'var(--space-10) var(--space-3)',
          textAlign: 'center',
        }}
      >
        <AnimateIn>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Ready to understand yourself better?
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Takes 3–5 minutes. Free forever.
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-block',
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 32px',
              borderRadius: 'var(--radius-button)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(45,91,255,0.3)',
            }}
          >
            Start your assessment →
          </Link>
        </AnimateIn>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-3)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          © 2026 BuddyAI — Social anxiety companion
        </p>
      </footer>
    </div>
  );
}
