import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT current_streak, longest_streak, last_completed_date, total_completions
       FROM streaks WHERE user_id = $1`,
      [session.user.id],
    );

    if (!result.rows[0]) {
      return NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
        total_completions: 0,
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Streak error:', err);
    return NextResponse.json({
      current_streak: 0,
      longest_streak: 0,
      last_completed_date: null,
      total_completions: 0,
    });
  }
}
