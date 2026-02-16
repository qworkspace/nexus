/**
 * Token Usage API
 * Endpoint: /api/tokens
 * Returns aggregated token usage data from session transcripts
 */

import { NextResponse } from 'next/server';
import { aggregateTokenUsage } from '@/lib/tokens/aggregator';
import { detectAlerts } from '@/lib/tokens/alerts';
import type { TokenUsageResponse } from '@/lib/tokens/types';

// ============================================================================
// Helper: Convert Date to AEST date string
// ============================================================================

function toAESTDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  // Returns YYYY-MM-DD format in AEST
}

// ============================================================================
// Cache Configuration
// ============================================================================

interface CachedData {
  data: TokenUsageResponse;
  timestamp: number;
}

// Module-level cache (5 minutes)
let cache: CachedData | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty period summary
 */
function createEmptyPeriodSummary(date: string): TokenUsageResponse['today'] {
  return {
    date,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
  };
}

/**
 * Summarize daily aggregations for a date range
 */
function summarizePeriod(
  byDay: Map<string, TokenUsageResponse['byDay'][number]>,
  startDate: string,
  endDate: string
): TokenUsageResponse['today'] {
  const entries = Array.from(byDay.values()).filter(
    (d) => d.date >= startDate && d.date <= endDate
  );

  if (entries.length === 0) {
    return createEmptyPeriodSummary(endDate);
  }

  return {
    date: endDate,
    input: entries.reduce((sum, d) => sum + d.input, 0),
    output: entries.reduce((sum, d) => sum + d.output, 0),
    cacheRead: entries.reduce((sum, d) => sum + d.cacheRead, 0),
    cacheWrite: entries.reduce((sum, d) => sum + d.cacheWrite, 0),
    totalTokens: entries.reduce((sum, d) => sum + d.totalTokens, 0),
    totalCost: entries.reduce((sum, d) => sum + d.totalCost, 0),
    inputCost: entries.reduce((sum, d) => sum + d.inputCost, 0),
    outputCost: entries.reduce((sum, d) => sum + d.outputCost, 0),
    cacheReadCost: entries.reduce((sum, d) => sum + d.cacheReadCost, 0),
    cacheWriteCost: entries.reduce((sum, d) => sum + d.cacheWriteCost, 0),
  };
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '14', 10);
  const force = searchParams.get('force') === 'true';

  const now = Date.now();

  // Check cache (unless force refresh)
  if (!force && cache && (now - cache.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate token usage
    const aggregated = await aggregateTokenUsage(startDate, endDate);

    // Date calculations
    const today = new Date();
    const todayStr = toAESTDateStr(today);

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toAESTDateStr(yesterday);

    // Start of week (Monday)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(today.getDate() - diff);
    const weekStartStr = toAESTDateStr(weekStart);

    // Start of month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = toAESTDateStr(monthStart);

    // Build period summaries
    const todaySummary = aggregated.byDay.get(todayStr) || createEmptyPeriodSummary(todayStr);
    const yesterdaySummary = aggregated.byDay.get(yesterdayStr) || createEmptyPeriodSummary(yesterdayStr);
    const thisWeekSummary = summarizePeriod(aggregated.byDay, weekStartStr, todayStr);
    const thisMonthSummary = summarizePeriod(aggregated.byDay, monthStartStr, todayStr);

    // Build daily usage array (last N days)
    const byDay: TokenUsageResponse['byDay'] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = toAESTDateStr(date);
      const dayData = aggregated.byDay.get(dateStr);
      if (dayData) {
        byDay.push({
          date: dayData.date,
          input: dayData.input,
          output: dayData.output,
          cacheRead: dayData.cacheRead,
          cacheWrite: dayData.cacheWrite,
          totalTokens: dayData.totalTokens,
          totalCost: dayData.totalCost,
          totalRequests: dayData.totalRequests,
          inputCost: dayData.inputCost,
          outputCost: dayData.outputCost,
          cacheReadCost: dayData.cacheReadCost,
          cacheWriteCost: dayData.cacheWriteCost,
        });
      } else {
        byDay.push({
          date: dateStr,
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
        });
      }
    }

    // Build model breakdown
    const byModel: TokenUsageResponse['byModel'] = Array.from(aggregated.byModel.values()).map((m) => ({
      model: m.model,
      provider: m.provider,
      input: m.input,
      output: m.output,
      cacheRead: m.cacheRead,
      cacheWrite: m.cacheWrite,
      totalTokens: m.totalTokens,
      totalCost: m.totalCost,
      requestCount: m.requestCount,
      avgCostPer1kTokens: m.totalTokens > 0 ? (m.totalCost / m.totalTokens) * 1000 : 0,
    }));

    // Sort by total tokens descending
    byModel.sort((a, b) => b.totalTokens - a.totalTokens);

    // Build provider breakdown
    const byProvider: TokenUsageResponse['byProvider'] = Array.from(aggregated.byProvider.values()).map((p) => ({
      provider: p.provider,
      input: p.input,
      output: p.output,
      cacheRead: p.cacheRead,
      cacheWrite: p.cacheWrite,
      totalTokens: p.totalTokens,
      totalCost: p.totalCost,
      requestCount: p.requestCount,
    }));

    // Sort by total cost descending
    byProvider.sort((a, b) => b.totalCost - a.totalCost);

    // Build session type breakdown
    const bySessionType: TokenUsageResponse['bySessionType'] = Array.from(
      aggregated.bySessionType.values()
    ).map((s) => ({
      type: s.type,
      input: s.input,
      output: s.output,
      cacheRead: s.cacheRead,
      cacheWrite: s.cacheWrite,
      totalTokens: s.totalTokens,
      totalCost: s.totalCost,
      requestCount: s.requestCount,
    }));

    // Build top consumers
    const topConsumers: TokenUsageResponse['topConsumers'] = Array.from(aggregated.bySession.values())
      .map((s) => ({
        sessionId: s.sessionId,
        agentType: s.agentType,
        sessionType: s.sessionType,
        label: s.label,
        totalTokens: s.totalTokens,
        totalCost: s.totalCost,
        timestamp: s.timestamp,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10);

    // Detect alerts
    const alerts = detectAlerts(aggregated);

    // Build response
    const response: TokenUsageResponse = {
      today: todaySummary,
      yesterday: yesterdaySummary,
      thisWeek: thisWeekSummary,
      thisMonth: thisMonthSummary,
      byDay,
      byModel,
      byProvider,
      bySessionType,
      topConsumers,
      alerts,
      cached: false,
      cacheTime: new Date().toISOString(),
    };

    // Update cache
    cache = {
      data: { ...response, cached: true },
      timestamp: now,
    };

    return NextResponse.json(response);
  } catch {
    // Return mock data on error (graceful degradation)
    const todayStr = toAESTDateStr(new Date());

    return NextResponse.json(
      {
        today: createEmptyPeriodSummary(todayStr),
        yesterday: createEmptyPeriodSummary(todayStr),
        thisWeek: createEmptyPeriodSummary(todayStr),
        thisMonth: createEmptyPeriodSummary(todayStr),
        byDay: [],
        byModel: [],
        byProvider: [],
        bySessionType: [],
        topConsumers: [],
        alerts: [],
        cached: false,
      } as TokenUsageResponse,
      { status: 500 }
    );
  }
}
