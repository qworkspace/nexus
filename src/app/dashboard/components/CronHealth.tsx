"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useCrons } from "../hooks/useCrons";

export function CronHealth() {
  const { upcoming, recent, totalCrons, ranToday, failures, nextRun, healthStatus } = useCrons();

  const getTimeUntil = (date: Date): string => {
    const diffMs = date.getTime() - Date.now();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "in 1 min";
    if (diffMins < 60) return `in ${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  };

  const getTimeAgo = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "success":
        return "✓";
      case "slow":
        return "⚠";
      case "error":
        return "✗";
      case "pending":
        return "•";
      default:
        return "?";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "slow":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "pending":
        return "text-zinc-400";
      default:
        return "text-zinc-400";
    }
  };

  const getHealthBadge = () => {
    if (healthStatus === "error") {
      return <span className="text-red-600 font-semibold">{failures} failure{failures > 1 ? 's' : ''}</span>;
    }
    if (healthStatus === "warning") {
      return <span className="text-yellow-600 font-semibold">Warning</span>;
    }
    return <span className="text-green-600 font-semibold">OK</span>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">CRON HEALTH</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs">
          View All
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upcoming Section */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 mb-2">UPCOMING (Next 2 hours)</h4>
            {upcoming.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No upcoming crons in the next 2 hours</p>
            ) : (
              <div className="space-y-1">
                {upcoming.slice(0, 3).map((cron) => (
                  <div
                    key={cron.id}
                    className="flex items-center gap-2 text-sm py-1.5"
                  >
                    <span className="w-4 text-center text-zinc-400">{getStatusIcon(cron.status)}</span>
                    <span className="text-zinc-700 flex-1">{cron.name}</span>
                    <span className="text-xs text-zinc-500">{cron.nextRun ? getTimeUntil(cron.nextRun) : "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Section */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 mb-2">RECENT (Last 2 hours)</h4>
            {recent.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No recent cron runs</p>
            ) : (
              <div className="space-y-1">
                {recent.slice(0, 3).map((cron) => (
                  <div
                    key={cron.id}
                    className="flex items-center gap-2 text-sm py-1.5"
                  >
                    <span className={`w-4 text-center font-semibold ${getStatusColor(cron.status)}`}>
                      {getStatusIcon(cron.status)}
                    </span>
                    <span className="text-zinc-700 flex-1">{cron.name}</span>
                    {cron.duration !== undefined && (
                      <span className="text-xs">
                        <span className={getStatusColor(cron.status)}>
                          {cron.status === "error" ? "FAILED" : "OK"}
                        </span>
                        <span className="text-zinc-400"> ({cron.duration}s)</span>
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {cron.lastRun ? getTimeAgo(cron.lastRun) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Status */}
          <div className="pt-3 border-t border-zinc-200">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>Health: {totalCrons} jobs | {ranToday} ran today | {getHealthBadge()}</span>
              {nextRun && (
                <span className="text-zinc-500">
                  Next: <span className="font-medium text-zinc-700">{nextRun.time}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
