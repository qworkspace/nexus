import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { aggregateUsageFromTranscripts } from '@/lib/data-utils';

export async function GET() {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    let source: 'live' | 'mock' | 'error' = 'live';
    let summary: { successRate: number; avgResponseTime: number; totalTasks: number; errorsToday: number };
    let daily: Array<{ date: string; successRate: number; avgDuration: number; taskCount: number }> = [];
    let errorPatterns: Array<{ message: string; count: number; lastOccurred: string }> = [];
    let topSlowTasks: Array<{ title: string; type: string; duration: number; timestamp: string }> = [];

    try {
      // Try to get real performance data from session transcripts
      const allUsage = await aggregateUsageFromTranscripts(thirtyDaysAgo, new Date());

      // Calculate basic metrics
      const totalRequests = allUsage.length;
      const totalTokens = allUsage.reduce((sum, u) => sum + u.totalTokens, 0);

      // Assume 100% success if no errors (transcripts don't track errors)
      const successCount = totalRequests;
      const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;

      // Estimate avg response time from tokens (heuristic: ~2s per 1000 tokens)
      const avgResponseTime = totalRequests > 0
        ? (totalTokens / totalRequests) * 0.002 * 1000
        : 0;

      // Errors today (none from transcripts, so 0)
      const errorsToday = 0;

      summary = {
        successRate: Math.round(successRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        totalTasks: totalRequests,
        errorsToday,
      };

      // Group by day for daily metrics
      const dailyMap = new Map<string, { success: number; total: number; durations: number[] }>();
      for (let i = 13; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        dailyMap.set(dateStr, { success: 0, total: 0, durations: [] });
      }

      allUsage.forEach((u) => {
        const dateStr = u.timestamp.toISOString().split("T")[0];
        const dayData = dailyMap.get(dateStr);
        if (dayData) {
          dayData.total++;
          dayData.success++; // Assume all successful
          const estDuration = u.totalTokens * 0.002 * 1000;
          dayData.durations.push(estDuration);
        }
      });

      daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          successRate: data.total > 0 ? (data.success / data.total) * 100 : 100,
          avgDuration: data.durations.length > 0
            ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
            : 0,
          taskCount: data.total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top slow tasks (sort by tokens)
      topSlowTasks = allUsage
        .sort((a, b) => b.totalTokens - a.totalTokens)
        .slice(0, 10)
        .map(u => ({
          title: `${u.model} usage`,
          type: 'api_call',
          duration: Math.round(u.totalTokens * 0.002 * 1000),
          timestamp: u.timestamp.toISOString(),
        }));

      // Error patterns (none from transcripts)
      errorPatterns = [];

      // If no transcript data, fall back to database
      if (allUsage.length === 0) {
        throw new Error('No transcript data');
      }

    } catch (transcriptError) {
      console.error('Failed to aggregate from transcripts, falling back to database:', transcriptError);

      // Fall back to database
      try {
        const [totalTasks, successCount, , errorsToday] = await Promise.all([
          db.activity.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
          db.activity.count({
            where: {
              timestamp: { gte: thirtyDaysAgo },
              status: "success"
            }
          }),
          db.activity.count({
            where: {
              timestamp: { gte: thirtyDaysAgo },
              status: "error"
            }
          }),
          db.activity.count({
            where: {
              timestamp: { gte: todayStart },
              status: "error",
            },
          }),
        ]);

        // Get average duration
        const durationStats = await db.activity.aggregate({
          where: {
            timestamp: { gte: thirtyDaysAgo },
            duration: { not: null }
          },
          _avg: { duration: true },
        });

        const successRate = totalTasks > 0 ? (successCount / totalTasks) * 100 : 100;
        const avgResponseTime = durationStats._avg.duration || 0;

        summary = {
          successRate: Math.round(successRate * 10) / 10,
          avgResponseTime: Math.round(avgResponseTime),
          totalTasks,
          errorsToday,
        };

        // Get daily performance data for last 14 days
        const dailyActivities = await db.activity.findMany({
          where: { timestamp: { gte: twoWeeksAgo } },
          select: { timestamp: true, status: true, duration: true },
        });

        // Aggregate by day
        const dailyMap = new Map<string, { success: number; total: number; durations: number[] }>();
        for (let i = 13; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split("T")[0];
          dailyMap.set(dateStr, { success: 0, total: 0, durations: [] });
        }

        dailyActivities.forEach((a) => {
          const dateStr = new Date(a.timestamp).toISOString().split("T")[0];
          const dayData = dailyMap.get(dateStr);
          if (dayData) {
            dayData.total++;
            if (a.status === "success") dayData.success++;
            if (a.duration) dayData.durations.push(a.duration);
          }
        });

        daily = Array.from(dailyMap.entries())
          .map(([date, data]) => ({
            date,
            successRate: data.total > 0 ? (data.success / data.total) * 100 : 100,
            avgDuration: data.durations.length > 0
              ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
              : 0,
            taskCount: data.total,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Get error patterns (group similar errors)
        const errorActivities = await db.activity.findMany({
          where: {
            status: "error",
            timestamp: { gte: thirtyDaysAgo },
          },
          select: { title: true, description: true, timestamp: true },
          orderBy: { timestamp: "desc" },
        });

        // Group errors by title (simplified pattern matching)
        const errorMap = new Map<string, { count: number; lastOccurred: Date }>();
        errorActivities.forEach((e) => {
          const existing = errorMap.get(e.title);
          if (existing) {
            existing.count++;
            if (new Date(e.timestamp) > new Date(existing.lastOccurred)) {
              existing.lastOccurred = e.timestamp;
            }
          } else {
            errorMap.set(e.title, { count: 1, lastOccurred: e.timestamp });
          }
        });

        errorPatterns = Array.from(errorMap.entries())
          .map(([message, data]) => ({
            message,
            count: data.count,
            lastOccurred: data.lastOccurred.toISOString(),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Get top slow tasks
        const dbTopSlowTasks = await db.activity.findMany({
          where: {
            duration: { not: null },
            timestamp: { gte: thirtyDaysAgo },
          },
          orderBy: { duration: "desc" },
          take: 10,
          select: { title: true, duration: true, timestamp: true, type: true },
        });

        // Filter null values with proper typing
        topSlowTasks = dbTopSlowTasks
          .filter((a): a is typeof a & { duration: number } => a.duration !== null)
          .map(a => ({
            title: a.title,
            type: a.type,
            duration: a.duration as number,
            timestamp: a.timestamp.toISOString(),
          }));

        source = totalTasks > 0 ? 'live' : 'mock';
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        source = 'error';

        // Provide mock data
        summary = {
          successRate: 98.5,
          avgResponseTime: 1250,
          totalTasks: 1250,
          errorsToday: 0,
        };
      }
    }

    return NextResponse.json({
      source,
      summary,
      daily,
      errorPatterns,
      topSlowTasks,
    });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      {
        source: 'error',
        error: "Failed to fetch performance data",
        summary: {
          successRate: 0,
          avgResponseTime: 0,
          totalTasks: 0,
          errorsToday: 0,
        },
        daily: [],
        errorPatterns: [],
        topSlowTasks: [],
      },
      { status: 500 }
    );
  }
}
