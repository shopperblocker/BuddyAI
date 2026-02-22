import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

function getBadge(score: number): string {
  if (score >= 4.5) return '🌟 Resilience Champion';
  if (score >= 4.0) return '💪 Growing Strong';
  if (score >= 3.5) return '🌱 Steady Progress';
  if (score >= 3.0) return '🔥 Building Momentum';
  if (score >= 2.5) return '💜 Honest Explorer';
  return '🌱 Starting Strong';
}

function getMessage(score: number): string {
  if (score >= 4.0)
    return 'You\'ve built real emotional strength. Keep nurturing what\'s working.';
  if (score >= 3.0)
    return 'You\'re doing the honest work. Every step forward counts.';
  return 'Awareness is the first act of courage. You\'re already doing it.';
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        card: {
          badge: '🌱 Starting Strong',
          message: 'Awareness is the first act of courage.',
          overall_score: null,
        },
      });
    }

    const result = await query(
      `SELECT scores FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [session.user.id],
    );

    if (!result.rows[0]) {
      return NextResponse.json({
        card: {
          badge: '🌱 Starting Strong',
          message: 'Complete your first assessment to unlock your wellness card.',
          overall_score: null,
        },
      });
    }

    const scores = typeof result.rows[0].scores === 'string'
      ? JSON.parse(result.rows[0].scores)
      : result.rows[0].scores;

    const avg =
      scores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / scores.length;
    const overall = Math.round(avg * 10) / 10;

    return NextResponse.json({
      card: {
        badge: getBadge(overall),
        message: getMessage(overall),
        overall_score: overall,
      },
    });
  } catch (err) {
    console.error('Share card error:', err);
    return NextResponse.json({
      card: { badge: '🌱 Starting Strong', message: 'Keep going — every step counts.', overall_score: null },
    });
  }
}
