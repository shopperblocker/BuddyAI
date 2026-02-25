'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

const BREATH_PHASES: BreathPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
const BREATH_PHASE_DURATION = 4000;
const BREATH_LABELS: Record<BreathPhase, string> = {
  inhale: 'Inhale',
  hold1: 'Hold',
  exhale: 'Exhale',
  hold2: 'Hold',
};
const BREATH_RADIUS: Record<BreathPhase, number> = {
  inhale: 48,
  hold1: 48,
  exhale: 28,
  hold2: 28,
};

export default function EmergencyModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const phaseIndexRef = useRef(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Box breathing animation — only on screen 2
  useEffect(() => {
    if (screen !== 2) return;
    phaseIndexRef.current = 0;
    setBreathPhase('inhale');
    setBreathCount(0);

    const timer = setInterval(() => {
      phaseIndexRef.current = (phaseIndexRef.current + 1) % 4;
      const nextPhase = BREATH_PHASES[phaseIndexRef.current];
      setBreathPhase(nextPhase);
      if (phaseIndexRef.current === 0) {
        setBreathCount((c) => c + 1);
      }
    }, BREATH_PHASE_DURATION);

    return () => clearInterval(timer);
  }, [screen]);

  // Auto-send opening message on screen 3
  useEffect(() => {
    if (screen !== 3 || chatMessages.length > 0) return;
    const opening = "I'm struggling right now and I need help.";
    const initial: ChatMessage[] = [{ role: 'user', content: opening }];
    setChatMessages(initial);
    sendEmergencyMessage(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendEmergencyMessage = async (msgs: ChatMessage[]) => {
    setChatLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: 'crisis support',
          scores: null,
          messages: msgs,
          crisisMode: true,
          responseDepth: 2,
          stateOfMind: 1,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm right here with you. You don't have to face this alone. Please reach out to 988 if you need immediate support." },
      ]);
    }
    setChatLoading(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const updated: ChatMessage[] = [...chatMessages, { role: 'user', content: chatInput.trim() }];
    setChatMessages(updated);
    setChatInput('');
    await sendEmergencyMessage(updated);
  };

  const r = BREATH_RADIUS[breathPhase];
  const center = 64;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
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
          maxWidth: 460,
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Screen 1: Crisis resources ─────────────────────────────────────── */}
        {screen === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🫂</div>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text)', margin: '0 0 8px' }}>
                You are not alone
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                If you are in crisis, help is here right now. Please reach out.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-3)' }}>
              {/* 988 */}
              <a
                href="tel:988"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 24 }}>📞</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-xs)', color: '#991B1B', margin: '0 0 2px' }}>
                    988 Suicide &amp; Crisis Lifeline
                  </p>
                  <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>Call or text 988 — free, 24/7</p>
                </div>
              </a>

              {/* Crisis Text Line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                }}
              >
                <span style={{ fontSize: 24 }}>💬</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-xs)', color: '#166534', margin: '0 0 2px' }}>
                    Crisis Text Line
                  </p>
                  <p style={{ fontSize: 12, color: '#15803D', margin: 0 }}>Text HOME to 741741 — free, 24/7</p>
                </div>
              </div>

              {/* International */}
              <a
                href="https://www.iasp.info/resources/Crisis_Centres/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--accent-light)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 24 }}>🌍</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-xs)', color: 'var(--accent)', margin: '0 0 2px' }}>
                    International Resources
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Find crisis centres near you</p>
                </div>
              </a>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '0 0 var(--space-3)' }} />

            <button
              onClick={() => setScreen(2)}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 10,
                boxShadow: '0 4px 12px rgba(45,91,255,0.25)',
              }}
            >
              Yes, I need more support →
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              I&apos;m okay — close
            </button>
          </div>
        )}

        {/* ── Screen 2: Grounding exercise ───────────────────────────────────── */}
        {screen === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text)', margin: '0 0 6px' }}>
                Take a breath with me
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                4 seconds each — inhale, hold, exhale, hold
              </p>
            </div>

            {/* Box breathing SVG */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <svg width={128} height={128} viewBox="0 0 128 128">
                {/* Outer ring */}
                <circle cx={center} cy={center} r={56} fill="none" stroke="var(--border)" strokeWidth={2} />
                {/* Animated fill ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="var(--accent-light)"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  style={{ transition: `r ${BREATH_PHASE_DURATION}ms ease-in-out, fill ${BREATH_PHASE_DURATION}ms ease-in-out` }}
                />
                {/* Phase label */}
                <text
                  x={center}
                  y={center + 5}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={500}
                  fill="var(--accent)"
                  style={{ fontFamily: 'inherit' }}
                >
                  {BREATH_LABELS[breathPhase]}
                </text>
              </svg>
            </div>

            {breathCount > 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                Breath {Math.min(breathCount, 4)} of 4
              </p>
            )}

            {/* 5-4-3-2-1 */}
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-3)',
                border: '1px solid var(--border)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 12px' }}>
                5-4-3-2-1 Grounding
              </p>
              {[
                { n: 5, sense: 'SEE', icon: '👁' },
                { n: 4, sense: 'TOUCH', icon: '✋' },
                { n: 3, sense: 'HEAR', icon: '👂' },
                { n: 2, sense: 'SMELL', icon: '👃' },
                { n: 1, sense: 'TASTE', icon: '👅' },
              ].map(({ n, sense, icon }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>
                    {icon} things you can <strong>{sense}</strong>
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setScreen(3)}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Talk to BuddyAI now →
            </button>
            <button
              onClick={() => setScreen(1)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Screen 3: Emergency chat ───────────────────────────────────────── */}
        {screen === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                marginBottom: 12,
              }}
            >
              <p style={{ fontSize: 12, color: '#991B1B', margin: 0, lineHeight: 1.5 }}>
                🆘 If you are in immediate danger, please call <strong>988</strong> or your local emergency number.
              </p>
            </div>

            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 500, margin: '0 0 10px' }}>
              BuddyAI — Crisis Support
            </p>

            {/* Chat window */}
            <div
              style={{
                maxHeight: 300,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 10,
                paddingBottom: 4,
              }}
            >
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 13px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                      color: msg.role === 'user' ? 'white' : 'var(--text)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                      boxShadow: 'var(--shadow-sm)',
                      whiteSpace: 'pre-wrap',
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
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 13px', borderRadius: '14px 14px 14px 4px', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BuddyAI</span>
                    here with you...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && chatInput.trim() && !chatLoading) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder="Talk to BuddyAI..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: '10px 13px',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: 'none',
                  background: chatInput.trim() && !chatLoading ? 'var(--accent)' : 'var(--border)',
                  color: chatInput.trim() && !chatLoading ? 'white' : 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                }}
              >
                →
              </button>
            </div>

            <button
              onClick={() => setScreen(2)}
              style={{
                marginTop: 10,
                padding: '9px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ← Back to grounding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
