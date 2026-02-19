"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PerformanceStatsProps {
  successRate: number;
  avgResponseTime: number;
  totalTasks: number;
  errorsToday: number;
}

export function PerformanceStats({
  successRate,
  avgResponseTime,
  totalTasks,
  errorsToday,
}: PerformanceStatsProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-3xl font-bold",
              successRate >= 95
                ? "text-zinc-900"
                : successRate >= 80
                ? "text-zinc-500"
                : "text-zinc-500"
            )}
          >
            {successRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">
            {formatDuration(avgResponseTime)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Per activity</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">{totalTasks}</div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Errors Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-3xl font-bold",
              errorsToday === 0 ? "text-zinc-900" : "text-zinc-500"
            )}
          >
            {errorsToday}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {errorsToday === 0 ? "All clear!" : "Needs attention"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
