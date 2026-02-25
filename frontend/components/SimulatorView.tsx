'use client';

import { useState, useEffect, useRef } from 'react';

interface ScorePayload {
  id: string;
  label: string;
  score: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEPTH_LABELS = ['Brief', 'Balanced', 'Deep'];
const MIND_LABELS = ['Very reactive', 'Scattered', 'Neutral', 'Grounded', 'In control'];

export default function SimulatorView({ scores }: { scores: ScorePayload[] | null }) {
  const [situation, setSituation] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseDepth, setResponseDepth] = useState(2);  // 1=brief, 2=balanced, 3=deep
  const [stateOfMind, setStateOfMind] = useState(3);      // 1=impulsive, 5=in control
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
        body: JSON.stringify({ situation, scores, messages: updated, responseDepth, stateOfMind }),
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

        {/* ── Sliders ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>
          {/* Response depth */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              padding: '16px var(--space-3)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Response depth</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--accent)',
                  background: 'var(--accent-light)',
                  padding: '3px 10px',
                  borderRadius: 99,
                }}
              >
                {DEPTH_LABELS[responseDepth - 1]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={responseDepth}
              onChange={(e) => setResponseDepth(Number(e.target.value))}
              className="buddy-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Brief</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Deep</span>
            </div>
          </div>

          {/* State of mind */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              padding: '16px var(--space-3)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>My state of mind</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: stateOfMind <= 2 ? '#9A3412' : stateOfMind >= 4 ? '#166534' : 'var(--text-secondary)',
                  background: stateOfMind <= 2 ? '#FFEDD5' : stateOfMind >= 4 ? '#DCFCE7' : 'var(--bg)',
                  padding: '3px 10px',
                  borderRadius: 99,
                }}
              >
                {MIND_LABELS[stateOfMind - 1]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={stateOfMind}
              onChange={(e) => setStateOfMind(Number(e.target.value))}
              className="buddy-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Impulsive</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>In control</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!situation.trim()}
          style={{
            width: '100%',
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
