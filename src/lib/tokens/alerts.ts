/**
 * Token Alert Detection Logic
 * Detect anomalous token usage patterns
 */

import { AggregatedData, TokenAlert } from './types';

// Alert thresholds
const ALERT_THRESHOLDS = {
  HIGH_DAILY_TOKENS: 500000, // 500K tokens from Anthropic in a single day
  SPIKE_MULTIPLIER: 3.0, // 3x average daily usage
  UNEXPECTED_MODELS: ['unknown'] as string[], // Models considered unexpected
} as const;

/**
 * Detect alerts from aggregated token data
 */
export function detectAlerts(aggregated: AggregatedData): TokenAlert[] {
  const alerts: TokenAlert[] = [];
  const byDay = Array.from(aggregated.byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (byDay.length === 0) {
    return alerts;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayData = byDay.find((d) => d.date === today);

  // 1. High daily usage alert
  if (todayData && todayData.totalTokens > ALERT_THRESHOLDS.HIGH_DAILY_TOKENS) {
    alerts.push({
      type: 'high_daily',
      severity: 'warning',
      message: `High daily token usage: ${formatTokens(todayData.totalTokens)}`,
      value: todayData.totalTokens,
      threshold: ALERT_THRESHOLDS.HIGH_DAILY_TOKENS,
      date: todayData.date,
    });
  }

  // 2. Spike detection (compare today to 7-day average)
  const recentDays = byDay.filter(
    (d) => d.date < today && daysBetween(d.date, today) <= 7
  );

  if (recentDays.length >= 3 && todayData) {
    const avgDaily = recentDays.reduce((sum, d) => sum + d.totalTokens, 0) / recentDays.length;
    const spikeThreshold = avgDaily * ALERT_THRESHOLDS.SPIKE_MULTIPLIER;

    if (todayData.totalTokens > spikeThreshold) {
      alerts.push({
        type: 'spike',
        severity: 'critical',
        message: `Usage spike: ${formatTokens(todayData.totalTokens)} (${(todayData.totalTokens / avgDaily).toFixed(1)}x 7-day avg)`,
        value: todayData.totalTokens,
        threshold: spikeThreshold,
        date: todayData.date,
      });
    }
  }

  // 3. Unusual model detection
  for (const [, modelData] of aggregated.byModel) {
    if ((ALERT_THRESHOLDS.UNEXPECTED_MODELS as readonly string[]).includes(modelData.model)) {
      if (modelData.totalTokens > 10000) { // Only alert on significant usage
        alerts.push({
          type: 'unusual_model',
          severity: 'warning',
          message: `Usage from unusual model: ${modelData.model}`,
          value: modelData.totalTokens,
          threshold: 10000,
          date: today,
        });
      }
    }
  }

  return alerts;
}

/**
 * Calculate days between two date strings (YYYY-MM-DD)
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format tokens for display
 */
function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M tokens`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K tokens`;
  }
  return `${tokens} tokens`;
}
