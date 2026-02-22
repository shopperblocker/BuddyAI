import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { callClaude } from '@/lib/claude';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already completed today
    const completedRow = await query(
      `SELECT id FROM daily_completions WHERE user_id = $1 AND completion_date = $2 LIMIT 1`,
      [userId, today],
    );
    const alreadyCompleted = completedRow.rows.length > 0;

    // Get latest assessment scores for personalization
    const assessmentRow = await query(
      `SELECT scores FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    let scoreContext = '';
    if (assessmentRow.rows[0]) {
      const scores = typeof assessmentRow.rows[0].scores === 'string'
        ? JSON.parse(assessmentRow.rows[0].scores)
        : assessmentRow.rows[0].scores;
      scoreContext = (scores as { label: string; score: number }[])
        .map((s) => `${s.label}: ${s.score}/5`)
        .join(', ');
    }

    const dateKey = req.url.includes('?date=')
      ? new URL(req.url).searchParams.get('date') ?? today
      : today;

    const prompt = `Today is ${dateKey}. Generate a daily social anxiety touchpoint for a user.
${scoreContext ? `Their wellness profile: ${scoreContext}` : ''}

Return ONLY valid JSON:
{
  "affirmation": "One short, genuine affirmation (1 sentence, warm and human — not cheesy)",
  "challenge": {
    "title": "A specific micro-challenge title (5-8 words)",
    "description": "2 sentences expanding on the challenge — practical and achievable today",
    "difficulty": "easy"
  },
  "comfort_zone": "One sentence describing a comfort zone expansion to notice today (observational, not demanding)"
}

Difficulty must be exactly one of: easy, medium, hard.
Make the challenge specific to their anxiety profile. Keep all text warm, human, and encouraging.`;

    const raw = await callClaude(
      'You are BuddyAI. Return ONLY valid JSON. No markdown.',
      [{ role: 'user', content: prompt }],
      400,
    );

    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      ...parsed,
      completed: alreadyCompleted,
      date: today,
    });
  } catch (err) {
    console.error('Challenge today error:', err);
    return NextResponse.json({
      affirmation: 'You showed up — that\'s the whole game.',
      challenge: {
        title: 'Make one brief eye contact',
        description: 'During your next interaction, hold eye contact for one extra beat before looking away. Small and specific.',
        difficulty: 'easy',
      },
      comfort_zone: 'Notice one moment where you wanted to disengage socially — and stay present 30 seconds longer.',
      completed: false,
      date: new Date().toISOString().split('T')[0],
    });
  }
}
