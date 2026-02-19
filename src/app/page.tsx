import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import Link from "next/link";
import { DollarSign } from "lucide-react";
// import { BugTrackerPanel } from "@/components/bugs/BugTrackerPanel";

async function getStats() {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [totalActivities, todayActivities, errorCount, todayCost, weekCost] = await Promise.all([
    db.activity.count(),
    db.activity.count({
      where: {
        timestamp: { gte: todayStart },
      },
    }),
    db.activity.count({
      where: { status: "error" },
    }),
    db.activity.aggregate({
      where: { timestamp: { gte: todayStart }, cost: { not: null } },
      _sum: { cost: true },
    }),
    db.activity.aggregate({
      where: { timestamp: { gte: weekStart }, cost: { not: null } },
      _sum: { cost: true },
    }),
  ]);

  return { 
    totalActivities, 
    todayActivities, 
    errorCount,
    todayCost: todayCost._sum.cost || 0,
    weekCost: weekCost._sum.cost || 0,
  };
}

async function getRecentActivity() {
  return db.activity.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
  });
}

export default async function Dashboard() {
  const stats = await getStats();
  const recentActivity = await getRecentActivity();

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of Q&apos;s activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              {stats.totalActivities}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              {stats.todayActivities}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-500">
              {stats.errorCount}
            </div>
          </CardContent>
        </Card>
        <Link href="/costs">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Token Costs
                </span>
                <span className="text-xs">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">
                ${stats.todayCost.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats.weekCost.toFixed(2)} this week
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bug Tracker Panel */}
      {/* <div className="mb-8">
        <BugTrackerPanel />
      </div> */}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Link
            href="/activity"
            className="text-sm text-muted-foreground hover:text-zinc-900"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No activity yet. Q will log actions here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 py-2 border-b border-zinc-100 last:border-0"
                >
                  <StatusDot status={activity.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.type} · {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors = {
    success: "bg-zinc-500",
    error: "bg-zinc-500",
    pending: "bg-zinc-500",
  };
  return (
    <span
      className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || "bg-zinc-400"}`}
    />
  );
}

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
