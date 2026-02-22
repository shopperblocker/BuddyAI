import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { scores } = await req.json();

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'scores array required' }, { status: 400 });
    }

    // Generate insight via internal route
    const insightRes = await fetch(
      new URL('/api/insight', req.url).toString(),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      },
    );

    const insightData = insightRes.ok ? await insightRes.json() : {};

    // Persist to DB if user is authenticated
    let assessmentId: string | null = null;
    if (session?.user?.id) {
      const result = await query(
        `INSERT INTO assessments (user_id, scores, insight, narrative, dimension_insights)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          session.user.id,
          JSON.stringify(scores),
          insightData.narrative ?? null,
          insightData.narrative ?? null,
          JSON.stringify(insightData.dimension_insights ?? {}),
        ],
      );
      assessmentId = result.rows[0]?.id ?? null;
    }

    return NextResponse.json({
      assessment_id: assessmentId,
      scores,
      narrative: insightData.narrative ?? null,
      dimension_insights: insightData.dimension_insights ?? null,
      growth_focus: insightData.growth_focus ?? null,
    });
  } catch (err) {
    console.error('Assessment submit error:', err);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
