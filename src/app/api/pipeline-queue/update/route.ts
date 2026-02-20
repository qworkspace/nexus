import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { briefId, title, problem, solution, impact, description, priority, complexity } = body;

    if (!briefId) return NextResponse.json({ error: 'briefId is required' }, { status: 400 });

    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });

    if (brief.status !== 'pending-review') {
      return NextResponse.json({ error: 'Only pending-review briefs can be edited' }, { status: 400 });
    }

    // Sync description with problem+solution if not explicitly provided
    const newProblem = problem ?? brief.problem;
    const newSolution = solution ?? brief.solution;
    const newDescription = description ?? ((problem || solution) ? `${newProblem || ''}\n\n${newSolution || ''}`.trim() : brief.description);

    const updated = await db.brief.update({
      where: { id: briefId },
      data: {
        title: title ?? brief.title,
        problem: newProblem,
        solution: newSolution,
        impact: impact ?? brief.impact,
        description: newDescription,
        priority: priority ?? brief.priority,
        complexity: complexity ?? brief.complexity,
      },
    });

    return NextResponse.json({ ok: true, briefId, updated });
  } catch (error) {
    console.error('pipeline-queue update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
