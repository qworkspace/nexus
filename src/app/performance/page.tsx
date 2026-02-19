import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { PerformanceStats } from "@/components/performance/performance-stats";
import { SuccessRateChart } from "@/components/performance/success-rate-chart";
import { ErrorPatterns } from "@/components/performance/error-patterns";
import { SlowTasks } from "@/components/performance/slow-tasks";
import { TrendingUp } from "lucide-react";

async function getPerformanceData() {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get overall summary
  const [totalTasks, successCount, errorsToday] = await Promise.all([
    db.activity.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
    db.activity.count({
      where: {
        timestamp: { gte: thirtyDaysAgo },
        status: "success",
      },
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
      duration: { not: null },
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
  const dailyMap = new Map<
    string,
    { success: number; total: number; durations: number[] }
  >();
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
      avgDuration:
        data.durations.length > 0
          ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
          : 0,
      taskCount: data.total,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get error patterns
  const errorActivities = await db.activity.findMany({
    where: {
      status: "error",
      timestamp: { gte: thirtyDaysAgo },
    },
    select: { title: true, timestamp: true },
    orderBy: { timestamp: "desc" },
  });

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

  return {
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
  };
}

export default async function PerformancePage() {
  const data = await getPerformanceData();

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Agent Performance
        </h1>
        <p className="text-muted-foreground text-sm">
          Success rates, response times, and error patterns
        </p>
      </div>

      {/* Summary Stats */}
      <PerformanceStats
        successRate={data.summary.successRate}
        avgResponseTime={data.summary.avgResponseTime}
        totalTasks={data.summary.totalTasks}
        errorsToday={data.summary.errorsToday}
      />

      {/* Success Rate Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={18} />
            Success Rate Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SuccessRateChart data={data.daily} />
        </CardContent>
      </Card>

      {/* Error Patterns and Slow Tasks */}
      <div className="grid grid-cols-2 gap-4">
        <ErrorPatterns errors={data.errorPatterns} />
        <SlowTasks tasks={data.topSlowTasks} />
      </div>
    </div>
  );
}
