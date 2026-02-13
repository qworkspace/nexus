"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useState } from "react";

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error' | 'timeout';
    lastDurationMs?: number;
    lastError?: string;
  };
}

interface CronListData {
  source: string;
  jobs: CronJob[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const statusConfig = {
  ok: { color: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  error: { color: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  timeout: { color: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

function formatNextRun(ms: number): string {
  const diff = ms - Date.now();
  if (diff < 0) return "overdue";
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return "soon";
}

function formatDuration(ms?: number): string {
  if (!ms) return "-";
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatLastRun(ms?: number): string {
  if (!ms) return "never";
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function CronMonitorPanel() {
  const { data, isLoading, mutate } = useSWR<CronListData>(
    "/api/crons/list",
    fetcher,
    { refreshInterval: 10000 }
  );
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const handleRunNow = async (jobId: string) => {
    setRunningJob(jobId);
    try {
      // Would call openclaw cron run <jobId>
      await new Promise(resolve => setTimeout(resolve, 1000));
      mutate();
    } finally {
      setRunningJob(null);
    }
  };

  // Sort jobs by next run time
  const sortedJobs = [...(data?.jobs || [])].sort(
    (a, b) => a.state.nextRunAtMs - b.state.nextRunAtMs
  );

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="text-lg">⏰</span>
          Cron Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 max-h-[260px] overflow-y-auto">
            {sortedJobs.slice(0, 5).map(job => {
              const status = job.state.lastStatus ? statusConfig[job.state.lastStatus] : null;
              const isRunning = runningJob === job.id;
              
              return (
                <div
                  key={job.id}
                  className={cn(
                    "p-2 rounded-lg border bg-white dark:bg-zinc-900/50 dark:border-zinc-800",
                    !job.enabled && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        job.enabled ? (status?.color || "bg-zinc-400") : "bg-zinc-300"
                      )} />
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {job.name}
                      </span>
                      {status && (
                        <Badge variant="secondary" className={cn("text-[10px] px-1", status.badge)}>
                          {job.state.lastStatus}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] shrink-0"
                      onClick={() => handleRunNow(job.id)}
                      disabled={isRunning || !job.enabled}
                    >
                      {isRunning ? "..." : "▶"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                      {job.schedule.expr}
                    </span>
                    <span className="text-green-600 dark:text-green-400 shrink-0">
                      {formatNextRun(job.state.nextRunAtMs)}
                    </span>
                    <span className="text-zinc-400 shrink-0">
                      last: {formatLastRun(job.state.lastRunAtMs)}
                    </span>
                    <span className="text-zinc-400 shrink-0">
                      {formatDuration(job.state.lastDurationMs)}
                    </span>
                  </div>
                  
                  {job.state.lastError && (
                    <p className="text-[10px] text-red-500 mt-1 truncate">
                      {job.state.lastError}
                    </p>
                  )}
                </div>
              );
            })}
            
            {sortedJobs.length > 5 && (
              <div className="text-center text-xs text-zinc-400 pt-1">
                +{sortedJobs.length - 5} more jobs
              </div>
            )}
          </div>
        )}

        {/* Quick Stats - Compact */}
        <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t dark:border-zinc-800">
          <span>{sortedJobs.filter(j => j.enabled).length} active</span>
          <span>
            {sortedJobs.filter(j => j.state.lastStatus === 'error').length} errors
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
