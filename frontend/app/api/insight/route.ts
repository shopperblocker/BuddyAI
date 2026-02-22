import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const { scores } = await req.json();

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'scores array required' }, { status: 400 });
    }

    const scoreLines = scores
      .map((s: { label: string; score: number }) => `${s.label}: ${s.score}/5`)
      .join('\n');

    const prompt = `Here are the user's social anxiety wellness scores:

${scoreLines}

Return ONLY valid JSON (no markdown, no explanation) with exactly this structure:
{
  "narrative": "2-3 sentence natural language profile that reads like a calm, empathetic friend speaking. Start with what they do well, then acknowledge the challenge area. Make it specific to these scores.",
  "dimension_insights": {
    "emotional": "one specific, actionable micro-insight for Emotional Resilience based on this score",
    "anxiety": "one specific, actionable micro-insight for Anxiety & Mental Clarity based on this score",
    "spiritual": "one specific, actionable micro-insight for Spiritual Connection based on this score",
    "social": "one specific, actionable micro-insight for Relational Wellness based on this score",
    "lifestyle": "one specific, actionable micro-insight for Body & Lifestyle based on this score"
  },
  "growth_focus": "name of the single dimension with the lowest score — the one to focus on this week"
}`;

    const raw = await callClaude(
      'You are BuddyAI, a warm social anxiety companion. Return ONLY valid JSON. No markdown. No explanation.',
      [{ role: 'user', content: prompt }],
      500,
    );

    // Parse the JSON, stripping any markdown fences
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      narrative: parsed.narrative,
      dimension_insights: parsed.dimension_insights,
      growth_focus: parsed.growth_focus,
    });
  } catch (err) {
    console.error('Insight error:', err);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
