import { ExtendedOutcome, DecisionStatus, ImpactLevel } from '@/types/decision';

/**
 * Calculate success score based on outcomes pass rate
 * @param outcomes - Array of extended outcomes
 * @returns Score from 0-100
 */
export function calculateSuccessScore(outcomes: ExtendedOutcome[]): number {
  if (!outcomes || outcomes.length === 0) return 0;

  const passed = outcomes.filter(o => o.status === 'passed').length;
  return Math.round((passed / outcomes.length) * 100);
}

/**
 * Determine status based on outcomes and validation state
 * @param outcomes - Array of extended outcomes
 * @param deployedAt - Deployment timestamp if available
 * @returns Decision status
 */
export function determineStatus(
  outcomes: ExtendedOutcome[],
  deployedAt?: string
): DecisionStatus {
  if (!outcomes || outcomes.length === 0) {
    return deployedAt ? 'validated' : 'pending';
  }

  const allPending = outcomes.every(o => o.status === 'pending');
  const allPassed = outcomes.every(o => o.status === 'passed');
  const anyFailed = outcomes.some(o => o.status === 'failed');

  if (allPending) return 'in-progress';
  if (anyFailed) return 'failed';
  if (allPassed) return 'validated';
  return 'in-progress';
}

/**
 * Determine impact level based on success score and context
 * @param successScore - Score from 0-100
 * @param context - Extended context description
 * @returns Impact level
 */
export function determineImpactLevel(
  successScore: number
): ImpactLevel {
  // Simple heuristic - can be enhanced with manual input
  if (successScore >= 90) return 'high';
  if (successScore >= 70) return 'medium';
  if (successScore >= 50) return 'low';
  return 'critical'; // Low success = critical impact
}

/**
 * Generate a unique outcome ID
 * @returns Outcome ID string
 */
export function generateOutcomeId(): string {
  return `out-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format impact level for display
 * @param level - Impact level
 * @returns Formatted string with emoji
 */
export function formatImpactLevel(level: ImpactLevel): string {
  const levels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return levels[level] || level;
}

/**
 * Format status for display
 * @param status - Decision status
 * @returns Formatted string with emoji
 */
export function formatStatus(status: DecisionStatus): string {
  const statuses = {
    'pending': '⚪ Pending',
    'in-progress': '⏳ In Progress',
    'validated': '✅ Validated',
    'failed': '❌ Failed',
  };
  return statuses[status] || status;
}
