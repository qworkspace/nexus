"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Power, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import useSWR from "swr";

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

interface CronListResponse {
  source: 'live' | 'mock' | 'error';
  jobs: CronJob[];
  error?: string;
}

async function fetcher(url: string): Promise<CronListResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function CronJobMonitor() {
  const { data, isLoading, mutate } = useSWR<CronListResponse>(
    '/api/crons/list',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const jobs = data?.jobs || [];

  const formatSchedule = (expr: string): string => {
    // Convert cron expression to human-readable
    const parts = expr.split(' ');
    if (parts.length < 5) return expr;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      // Daily schedule
      if (hour !== '*' && minute !== '*') {
        return `Daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      }
    }

    return expr;
  };

  const getTimeUntil = (nextRunAtMs: number): string => {
    const diffMs = nextRunAtMs - Date.now();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return "overdue";
    if (diffMins < 60) return `in ${diffMins} min`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  };

  const getTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return '-';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-zinc-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-zinc-500" />;
      case 'timeout':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-400" />;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">SUCCESS</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">ERROR</Badge>;
      case 'timeout':
        return <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">TIMEOUT</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">PENDING</Badge>;
    }
  };

  const handleRunNow = async (jobId: string) => {
    try {
      // Would call API to run job now
      console.log("Running job:", jobId);
      mutate();
    } catch (error) {
      console.error("Failed to run job:", error);
    }
  };

  const handleDisable = async (jobId: string, enabled: boolean) => {
    try {
      // Would call API to toggle job
      console.log("Toggling job:", jobId, enabled ? "disable" : "enable");
      mutate();
    } catch (error) {
      console.error("Failed to toggle job:", error);
    }
  };

  const enabledJobs = jobs.filter(j => j.enabled);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const disabledJobs = jobs.filter(j => !j.enabled);
  const failedJobs = jobs.filter(j => j.state.lastStatus === 'error');
  const totalRuns = jobs.filter(j => j.state.lastRunAtMs).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            CRON JOBS
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            {enabledJobs.length} enabled · {failedJobs.length} failures · {totalRuns} runs today
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/crons'}
          className="text-xs"
        >
          View All
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-zinc-500">
              Loading cron jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 text-sm text-zinc-500">
              No cron jobs configured
            </div>
          ) : (
            jobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {job.name}
                      </p>
                      {!job.enabled && (
                        <Badge variant="outline" className="text-xs text-zinc-500">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatSchedule(job.schedule.expr)}
                    </p>
                  </div>
                  {getStatusIcon(job.state.lastStatus)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Next:</span>{' '}
                      <span className={job.enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}>
                        {getTimeUntil(job.state.nextRunAtMs)}
                      </span>
                    </div>
                    {job.state.lastRunAtMs && (
                      <div className="text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Last:</span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {getTimeAgo(job.state.lastRunAtMs)}
                        </span>
                      </div>
                    )}
                    {job.state.lastDurationMs !== undefined && (
                      <div className="text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Duration:</span>{' '}
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {(job.state.lastDurationMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {job.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleRunNow(job.id)}
                        title="Run now"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 text-xs ${
                        job.enabled
                          ? "text-zinc-500 hover:text-zinc-500"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                      onClick={() => handleDisable(job.id, job.enabled)}
                      title={job.enabled ? "Disable" : "Enable"}
                    >
                      <Power className={`h-3 w-3 ${job.enabled ? "" : "text-zinc-400"}`} />
                    </Button>
                  </div>
                </div>

                {job.state.lastStatus === 'error' && job.state.lastError && (
                  <div className="mt-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 rounded p-2">
                    {job.state.lastError}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-zinc-500" />
                {totalRuns - failedJobs.length} successful
              </span>
              {failedJobs.length > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-zinc-500" />
                  {failedJobs.length} failed
                </span>
              )}
            </div>
            <span>Enabled: {enabledJobs.length}/{jobs.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
