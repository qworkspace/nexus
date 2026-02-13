import { NextResponse } from 'next/server';
import { getRecentBuilds, aggregateUsageFromTranscripts } from '@/lib/data-utils';

interface BuildStats {
  source: 'live' | 'mock' | 'error';
  totalToday: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  byModel?: { model: string; count: number; successRate: number }[];
  error?: string;
}

export async function GET(): Promise<NextResponse<BuildStats>> {
  try {
    // Get all recent builds (last 100) for stats
    const allBuilds = await getRecentBuilds('dev', 100);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Filter today's builds
    const todayBuilds = allBuilds.filter((b) => {
      const completedAt = new Date(b.completedAt as string);
      return completedAt >= todayStart;
    });

    const totalToday = todayBuilds.length;

    // Calculate success rate
    const successCount = allBuilds.filter((b) => b.status === 'success').length;
    const successRate = allBuilds.length > 0
      ? Math.round((successCount / allBuilds.length) * 100)
      : 100;

    // Calculate average duration (convert seconds to milliseconds for UI)
    const durations = allBuilds
      .map((b) => b.duration as number)
      .filter((d) => d > 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) * 1000
      : 0;

    // Get cost from transcripts for today
    let totalCost = 0;
    try {
      const todayUsage = await aggregateUsageFromTranscripts(todayStart, new Date());
      // Filter for dev agent
      const devUsage = todayUsage.filter((u) => u.agent === 'dev');
      totalCost = devUsage.reduce((sum, u) => sum + u.cost, 0);
    } catch {
      totalCost = 0;
    }

    // Group by model
    const modelMap = new Map<string, { count: number; success: number }>();
    for (const build of allBuilds) {
      const model = build.model as string;
      const existing = modelMap.get(model) || { count: 0, success: 0 };
      modelMap.set(model, {
        count: existing.count + 1,
        success: existing.success + (build.status === 'success' ? 1 : 0),
      });
    }

    const byModel = Array.from(modelMap.entries()).map(([model, stats]) => ({
      model,
      count: stats.count,
      successRate: Math.round((stats.success / stats.count) * 100),
    }));

    if (allBuilds.length > 0) {
      return NextResponse.json({
        source: 'live',
        totalToday,
        successRate,
        avgDuration,
        totalCost: parseFloat(totalCost.toFixed(2)),
        byModel,
      });
    }

    // Return mock data if no builds found
    return NextResponse.json({
      source: 'mock',
      totalToday: 5,
      successRate: 95,
      avgDuration: 780000,
      totalCost: 3.45,
      byModel: [
        { model: 'glm-4.7', count: 3, successRate: 100 },
        { model: 'claude-opus-4-5', count: 2, successRate: 90 },
      ],
    });
  } catch (error) {
    console.error('Error fetching build stats:', error);
    return NextResponse.json({
      source: 'error',
      totalToday: 0,
      successRate: 0,
      avgDuration: 0,
      totalCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
