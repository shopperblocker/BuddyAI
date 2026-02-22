import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const { situation, scores, messages } = await req.json();

    if (!situation || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'situation and messages required' }, { status: 400 });
    }

    const scoreContext = scores
      ? (scores as { label: string; score: number }[])
          .map((s) => `${s.label}: ${s.score}/5`)
          .join(', ')
      : '';

    const system = `You are BuddyAI, a warm, calm social anxiety coach. The user is practicing a social situation they find anxiety-inducing.

Situation they're preparing for: "${situation}"
${scoreContext ? `Their wellness profile: ${scoreContext}` : ''}

Your role: Coach them through the anxiety with empathy, practical steps, and gentle encouragement. Be conversational (2-4 sentences). Don't be clinical. Speak like a trusted friend who also happens to know evidence-based CBT and acceptance techniques.`;

    const conversationMessages = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await callClaude(system, conversationMessages, 250);
    return NextResponse.json({ response });
  } catch (err) {
    console.error('Simulate error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
