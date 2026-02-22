import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { challengeType, challengeText } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Idempotent: check if already completed today
    const existing = await query(
      `SELECT id FROM daily_completions WHERE user_id = $1 AND completion_date = $2`,
      [userId, today],
    );

    if (existing.rows.length === 0) {
      // Insert completion
      await query(
        `INSERT INTO daily_completions (user_id, challenge_text, challenge_type, completion_date)
         VALUES ($1, $2, $3, $4)`,
        [userId, challengeText ?? '', challengeType ?? 'challenge', today],
      );

      // Update streak
      const streakRow = await query(
        `SELECT current_streak, longest_streak, last_completed_date FROM streaks WHERE user_id = $1`,
        [userId],
      );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!streakRow.rows[0]) {
        // First completion
        await query(
          `INSERT INTO streaks (user_id, current_streak, longest_streak, last_completed_date, total_completions)
           VALUES ($1, 1, 1, $2, 1)`,
          [userId, today],
        );
      } else {
        const { current_streak, longest_streak, last_completed_date } = streakRow.rows[0];
        const lastDate = last_completed_date
          ? new Date(last_completed_date).toISOString().split('T')[0]
          : null;

        let newStreak = 1;
        if (lastDate === yesterdayStr) {
          newStreak = current_streak + 1;
        } else if (lastDate === today) {
          newStreak = current_streak; // already counted
        }

        const newLongest = Math.max(longest_streak, newStreak);

        await query(
          `UPDATE streaks
           SET current_streak = $1, longest_streak = $2, last_completed_date = $3, total_completions = total_completions + 1
           WHERE user_id = $4`,
          [newStreak, newLongest, today, userId],
        );
      }
    }

    // Return updated streak
    const updatedStreak = await query(
      `SELECT current_streak, longest_streak, total_completions FROM streaks WHERE user_id = $1`,
      [userId],
    );

    return NextResponse.json({
      success: true,
      streak: updatedStreak.rows[0] ?? { current_streak: 1, longest_streak: 1, total_completions: 1 },
    });
  } catch (err) {
    console.error('Challenge complete error:', err);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}
