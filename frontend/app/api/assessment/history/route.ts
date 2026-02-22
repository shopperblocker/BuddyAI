import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ history: [] });
    }

    const result = await query(
      `SELECT scores, created_at
       FROM assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 3`,
      [session.user.id],
    );

    const history = result.rows.map((row) => ({
      scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores,
      created_at: row.created_at,
    }));

    return NextResponse.json({ history });
  } catch (err) {
    console.error('Assessment history error:', err);
    return NextResponse.json({ history: [] });
  }
}
