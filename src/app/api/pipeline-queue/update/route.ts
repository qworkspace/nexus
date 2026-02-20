import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { briefId, title, problem, solution, impact, description, priority, complexity,
      tldr, skipCost, front, researchRef, assignee,
      qReview } = body;

    if (!briefId) return NextResponse.json({ error: 'briefId is required' }, { status: 400 });

    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });

    // Build update data — only set fields that were provided
    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (problem !== undefined) data.problem = problem;
    if (solution !== undefined) data.solution = solution;
    if (impact !== undefined) data.impact = impact;
    if (priority !== undefined) data.priority = priority;
    if (complexity !== undefined) data.complexity = complexity;
    if (tldr !== undefined) data.tldr = tldr;
    if (skipCost !== undefined) data.skipCost = skipCost;
    if (front !== undefined) data.front = front;
    if (researchRef !== undefined) data.researchRef = researchRef;
    if (assignee !== undefined) data.assignee = assignee;

    // Sync description
    if (problem !== undefined || solution !== undefined) {
      const newProblem = problem ?? brief.problem;
      const newSolution = solution ?? brief.solution;
      data.description = description ?? `${newProblem || ''}\n\n${newSolution || ''}`.trim();
    } else if (description !== undefined) {
      data.description = description;
    }

    // Handle qReview fields
    if (qReview && typeof qReview === 'object') {
      data.qReviewedAt = qReview.qReviewedAt ? new Date(qReview.qReviewedAt) : new Date();
      if (qReview.complexityAssessed) data.qComplexity = qReview.complexityAssessed;
      if (qReview.complexityChanged !== undefined) data.qComplexityChanged = qReview.complexityChanged;
      if (qReview.missingInfo) data.qMissingInfo = JSON.stringify(qReview.missingInfo);
      if (qReview.prerequisites) data.qPrerequisites = JSON.stringify(qReview.prerequisites);
      if (qReview.riskSummary) data.qRisk = qReview.riskSummary;
      if (qReview.recommendation) data.qRecommendation = qReview.recommendation;
      if (qReview.recommendationReason) data.qRecommendationReason = qReview.recommendationReason;
      if (qReview.summary) data.qSummary = qReview.summary;
    }

    const updated = await db.brief.update({
      where: { id: briefId },
      data,
    });

    return NextResponse.json({ ok: true, briefId, updated });
  } catch (error) {
    console.error('pipeline-queue update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
