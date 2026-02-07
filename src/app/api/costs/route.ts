import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
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

    const byModel = byModelRaw.map((m) => ({
      model: m.model || "unknown",
      cost: m._sum.cost || 0,
      count: m._count.id,
    }));

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
    for (let i = 0; i < 14; i++) {
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

    const byType = byTypeRaw.map((t) => ({
      type: t.type,
      cost: t._sum.cost || 0,
      count: t._count.id,
    }));

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

    return NextResponse.json({
      today: todayData._sum.cost || 0,
      thisWeek: weekData._sum.cost || 0,
      thisMonth: monthData._sum.cost || 0,
      byModel,
      byDay,
      byType,
      topExpensive,
    });
  } catch (error) {
    console.error("Error fetching costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch costs" },
      { status: 500 }
    );
  }
}
