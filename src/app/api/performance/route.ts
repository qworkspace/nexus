import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get overall summary
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

    // Get daily performance data for the last 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
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

    const daily = Array.from(dailyMap.entries())
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

    const errorPatterns = Array.from(errorMap.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: data.lastOccurred.toISOString(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top slow tasks
    const topSlowTasks = await db.activity.findMany({
      where: { 
        duration: { not: null },
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { duration: "desc" },
      take: 10,
      select: { title: true, duration: true, timestamp: true, type: true },
    });

    return NextResponse.json({
      summary: {
        successRate: Math.round(successRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        totalTasks,
        errorsToday,
      },
      daily,
      errorPatterns,
      topSlowTasks: topSlowTasks.map((t) => ({
        title: t.title,
        type: t.type,
        duration: t.duration,
        timestamp: t.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
