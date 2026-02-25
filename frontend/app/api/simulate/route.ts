import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[\*\-]\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req: Request) {
  try {
    const {
      situation,
      scores,
      messages,
      responseDepth = 2,
      stateOfMind = 3,
      crisisMode = false,
    } = await req.json();

    if (!situation || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'situation and messages required' }, { status: 400 });
    }

    const scoreContext = scores
      ? (scores as { label: string; score: number }[])
          .map((s) => `${s.label}: ${s.score}/5`)
          .join(', ')
      : '';

    // Token budget from response depth slider (1=brief, 2=balanced, 3=deep)
    const maxTokens = responseDepth === 1 ? 120 : responseDepth === 3 ? 500 : 250;

    // Depth instruction
    const depthInstruction =
      responseDepth === 1
        ? 'Be very brief: 1-2 sentences max. Quick, warm, and actionable.'
        : responseDepth === 3
          ? 'Be thorough: 4-6 sentences with deeper coaching, reflection prompts, and specific techniques.'
          : 'Be conversational: 2-4 sentences.';

    // State-of-mind tone adjustment (1=impulsive/reactive, 5=in control/calm)
    const stateContext =
      stateOfMind <= 2
        ? '\n\nIMPORTANT: The user is in a reactive, high-impulse state right now. Lead with grounding — slow breathing, naming the feeling, one small concrete step. Keep your tone extra gentle and simple. Do not challenge them yet.'
        : stateOfMind >= 4
          ? '\n\nIMPORTANT: The user feels calm and in control right now. You can be more direct and growth-focused. Gently challenge their assumptions, introduce deeper reflection, and focus on building lasting patterns.'
          : '';

    const regularSystem = `You are BuddyAI, a warm, calm social anxiety coach. The user is practicing a social situation they find anxiety-inducing.

Situation they're preparing for: "${situation}"
${scoreContext ? `Their wellness profile: ${scoreContext}` : ''}

Your role: Coach them through the anxiety with empathy, practical steps, and gentle encouragement. Don't be clinical. Speak like a trusted friend who also happens to know evidence-based CBT and acceptance techniques. ${depthInstruction}${stateContext}

IMPORTANT: Return plain text only. No markdown, no asterisks, no bullet points, no headers with #, no backticks. Write in natural flowing sentences only.`;

    const crisisSystem = `You are BuddyAI providing immediate compassionate support to someone in distress. Lead with validation and presence. Be warm, steady, and non-judgmental. Never minimize what they are feeling. Keep responses to 2-3 sentences. Gently remind them that professional help is available — 988 Suicide and Crisis Lifeline (call or text 988) and Crisis Text Line (text HOME to 741741). Return plain text only. No markdown.`;

    const finalSystem = crisisMode ? crisisSystem : regularSystem;

    const conversationMessages = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await callClaude(finalSystem, conversationMessages, crisisMode ? 200 : maxTokens);
    return NextResponse.json({ response: stripMarkdown(response) });
  } catch (err) {
    console.error('Simulate error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
