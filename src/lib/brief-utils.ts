import type { Brief } from '@prisma/client';

// Convert Prisma Brief row back to the shape the frontend expects
export function briefToJson(b: Brief) {
  const extra = b.metadata ? JSON.parse(b.metadata) : {};
  const qReview = (b.qReviewedAt || b.qRecommendation) ? {
    qReviewedAt: b.qReviewedAt?.toISOString() ?? undefined,
    complexityAssessed: b.qComplexity ?? undefined,
    complexityChanged: b.qComplexityChanged ?? undefined,
    missingInfo: b.qMissingInfo ? JSON.parse(b.qMissingInfo) : undefined,
    prerequisites: b.qPrerequisites ? JSON.parse(b.qPrerequisites) : undefined,
    riskSummary: b.qRisk ?? undefined,
    recommendation: b.qRecommendation ?? undefined,
    recommendationReason: b.qRecommendationReason ?? undefined,
    summary: b.qSummary ?? undefined,
  } : undefined;

  return {
    id: b.id,
    title: b.title,
    description: b.description,
    problem: b.problem,
    solution: b.solution,
    impact: b.impact,
    source: b.source,
    sourceRef: b.sourceRef,
    status: b.status,
    priority: b.priority,
    complexity: b.complexity,
    front: b.front,
    tldr: b.tldr,
    skipCost: b.skipCost,
    briefPath: b.briefPath,
    researchRef: b.researchRef,
    assignee: b.assignee,
    approvedBy: b.approvedBy ?? null,
    submittedBy: b.submittedBy ?? null,
    buildCommit: b.buildCommit,
    createdAt: b.createdAt.toISOString(),
    approvedAt: b.approvedAt?.toISOString() ?? null,
    shippedAt: b.shippedAt?.toISOString() ?? null,
    rejectedAt: b.rejectedAt?.toISOString() ?? null,
    rejectReason: b.rejectReason,
    rejectComment: b.rejectComment,
    rejectedReason: b.rejectedReason,
    qReview,
    ...extra,
  };
}
