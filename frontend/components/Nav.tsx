"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Nav() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={scrolled ? 'nav-scrolled' : ''}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: `background var(--duration-normal) var(--ease), border-color var(--duration-normal) var(--ease)`,
        padding: '0 var(--space-3)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href={session ? '/dashboard' : '/'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'var(--text)',
            fontWeight: 500,
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ fontSize: 20 }}>🫂</span>
          <span>BuddyAI</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {session ? (
            <>
              <Link
                href="/dashboard"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--duration-fast) var(--ease)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'opacity var(--duration-fast) var(--ease)',
                }}
                title={`Sign out (${session.user?.name})`}
              >
                {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--duration-fast) var(--ease)',
                }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-button)',
                  transition: 'opacity var(--duration-fast) var(--ease)',
                }}
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
