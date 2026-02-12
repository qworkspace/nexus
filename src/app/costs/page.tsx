import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { CostChart } from "@/components/costs/cost-chart";
import { CostBreakdown } from "@/components/costs/cost-breakdown";
import { ExpensiveActivities } from "@/components/costs/expensive-activities";
import { BarChart3 } from "lucide-react";

async function getCostData() {
  const now = new Date();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get cost summaries
  const [todayData, weekData, monthData] = await Promise.all([
    db.activity.aggregate({
      where: { timestamp: { gte: todayStart }, cost: { not: null } },
      _sum: { cost: true },
    }),
    db.activity.aggregate({
      where: { timestamp: { gte: weekStart }, cost: { not: null } },
      _sum: { cost: true },
    }),
    db.activity.aggregate({
      where: { timestamp: { gte: monthStart }, cost: { not: null } },
      _sum: { cost: true },
    }),
  ]);

  // Get cost by model
  const byModelRaw = await db.activity.groupBy({
    by: ["model"],
    where: { cost: { not: null }, model: { not: null } },
    _sum: { cost: true },
    _count: { id: true },
  });

  const byModel = byModelRaw
    .map((m) => ({
      label: m.model || "unknown",
      cost: m._sum.cost || 0,
      count: m._count.id,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Get daily costs for the last 14 days
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const dailyActivities = await db.activity.findMany({
    where: {
      timestamp: { gte: twoWeeksAgo },
      cost: { not: null },
    },
    select: { timestamp: true, cost: true },
  });

  // Aggregate by day
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, 0);
  }

  dailyActivities.forEach((a) => {
    const dateStr = new Date(a.timestamp).toISOString().split("T")[0];
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + (a.cost || 0));
  });

  const byDay = Array.from(dailyMap.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get cost by activity type
  const byTypeRaw = await db.activity.groupBy({
    by: ["type"],
    where: { cost: { not: null } },
    _sum: { cost: true },
    _count: { id: true },
  });

  const byType = byTypeRaw
    .map((t) => ({
      label: t.type,
      cost: t._sum.cost || 0,
      count: t._count.id,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Get top 10 most expensive activities
  const topExpensive = await db.activity.findMany({
    where: { cost: { not: null } },
    orderBy: { cost: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      type: true,
      cost: true,
      tokensIn: true,
      tokensOut: true,
      model: true,
      timestamp: true,
    },
  });

  return {
    today: todayData._sum.cost || 0,
    thisWeek: weekData._sum.cost || 0,
    thisMonth: monthData._sum.cost || 0,
    byModel,
    byDay,
    byType,
    topExpensive,
  };
}

export default async function CostsPage() {
  const data = await getCostData();

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Token Costs</h1>
        <p className="text-zinc-500 text-sm">
          Track spending across models and activities
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              ${data.today.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              ${data.thisWeek.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              ${data.thisMonth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} />
            Daily Costs (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CostChart data={data.byDay} />
        </CardContent>
      </Card>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <CostBreakdown
          title="By Model"
          icon="🤖"
          items={data.byModel}
        />
        <CostBreakdown
          title="By Activity Type"
          icon="📁"
          items={data.byType}
        />
      </div>

      {/* Top Expensive */}
      <ExpensiveActivities activities={data.topExpensive} />
    </div>
  );
}
