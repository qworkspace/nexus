import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import Link from "next/link";

async function getStats() {
  const [totalActivities, todayActivities, errorCount] = await Promise.all([
    db.activity.count(),
    db.activity.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.activity.count({
      where: { status: "error" },
    }),
  ]);

  return { totalActivities, todayActivities, errorCount };
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
        <p className="text-zinc-500 text-sm">Overview of Q&apos;s activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
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
            <CardTitle className="text-sm font-medium text-zinc-500">
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
            <CardTitle className="text-sm font-medium text-zinc-500">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.errorCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Link
            href="/activity"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">
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
                    <p className="text-xs text-zinc-500">
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
    success: "bg-green-500",
    error: "bg-red-500",
    pending: "bg-yellow-500",
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
