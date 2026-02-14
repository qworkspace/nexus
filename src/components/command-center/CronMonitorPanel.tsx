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
  payload: {
    model: string;
  };
  delivery: {
    mode: 'none' | 'announce';
  };
  sessionTarget: 'main' | 'isolated';
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error' | 'timeout';
    lastDurationMs?: number;
    lastError?: string;
    consecutiveErrors?: number;
  };
}

interface CronListData {
  source: string;
  jobs: CronJob[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const modelColors: Record<string, string> = {
  zai: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  anthropic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ollama: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  openai: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function getModelBadgeClass(model: string): string {
  const provider = model.split('/')[0]?.toLowerCase() || 'unknown';
  return modelColors[provider] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
}

function formatModelName(model: string): string {
  const parts = model.split('/');
  const name = parts[parts.length - 1] || model;

  return name
    .replace('claude-', '')
    .replace('gpt-', 'GPT-')
    .toUpperCase();
}

function DeliveryIcon({ mode }: { mode: 'none' | 'announce' }) {
  return mode === 'announce'
    ? <span title="Announces to chat">🔔</span>
    : <span title="Silent" className="opacity-40">🔕</span>;
}

function SessionBadge({ target }: { target: 'main' | 'isolated' }) {
  return (
    <span className={cn(
      "text-[9px] px-1 py-0.5 rounded font-mono",
      target === 'main'
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
    )}>
      {target === 'main' ? 'MAIN' : 'ISO'}
    </span>
  );
}

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

function CronStatsHeader({ jobs }: { jobs: CronJob[] }) {
  const enabled = jobs.filter(j => j.enabled).length;
  const disabled = jobs.length - enabled;
  const errored = jobs.filter(j => j.state.lastStatus === 'error').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const consecutiveErrors = jobs.filter(j => (j.state.consecutiveErrors || 0) > 0).length;

  const models = [...new Set(jobs.map(j => j.payload.model))];

  return (
    <div className="flex flex-wrap gap-2 text-[10px] mb-2">
      <span className="text-zinc-500">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{jobs.length}</span> total
      </span>
      <span className="text-green-600 dark:text-green-400">
        <span className="font-semibold">{enabled}</span> active
      </span>
      {disabled > 0 && (
        <span className="text-zinc-400">
          <span className="font-semibold">{disabled}</span> paused
        </span>
      )}
      {errored > 0 && (
        <span className="text-red-600 dark:text-red-400">
          <span className="font-semibold">{errored}</span> errors
        </span>
      )}
      <span className="text-zinc-400">
        <span className="font-semibold">{models.length}</span> models
      </span>
    </div>
  );
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
        {!isLoading && data?.jobs && <CronStatsHeader jobs={data.jobs} />}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 max-h-[260px] overflow-y-auto">
            {sortedJobs.map(job => {
              const status = job.state.lastStatus ? statusConfig[job.state.lastStatus] : null;
              const isRunning = runningJob === job.id;

              return (
                <div
                  key={job.id}
                  className={cn(
                    "p-2 rounded-lg border bg-white dark:bg-zinc-900/50 dark:border-zinc-800",
                    !job.enabled && "opacity-50",
                    job.state.lastStatus === 'error' && "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        job.enabled ? (status?.color || "bg-zinc-400") : "bg-zinc-300"
                      )} />
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {job.name}
                      </span>

                      <Badge variant="secondary" className={cn("text-[9px] px-1", getModelBadgeClass(job.payload.model))}>
                        {formatModelName(job.payload.model)}
                      </Badge>

                      <DeliveryIcon mode={job.delivery.mode} />

                      <SessionBadge target={job.sessionTarget} />

                      {job.state.lastStatus === 'error' && (
                        <Badge variant="secondary" className="text-[9px] px-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {job.state.consecutiveErrors || 1}x ERR
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
                      {job.state.consecutiveErrors && job.state.consecutiveErrors > 1 && (
                        <span className="font-semibold">[{job.state.consecutiveErrors}x] </span>
                      )}
                      {job.state.lastError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
