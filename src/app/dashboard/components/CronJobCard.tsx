"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Power, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export interface CronJob {
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

interface CronJobCardProps {
  job: CronJob;
  onToggle?: (id: string, enabled: boolean) => Promise<void>;
  onRunNow?: (id: string) => Promise<void>;
  onViewHistory?: (id: string) => void;
  showHistory?: boolean;
}

export function CronJobCard({
  job,
  onToggle,
  onRunNow,
  onViewHistory,
  showHistory = false,
}: CronJobCardProps) {
  const formatSchedule = (expr: string): string => {
    const parts = expr.split(' ');
    if (parts.length < 5) return expr;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-400" />;
    }
  };

  const handleToggle = async () => {
    if (onToggle) {
      await onToggle(job.id, job.enabled);
    }
  };

  const handleRunNow = async () => {
    if (onRunNow) {
      await onRunNow(job.id);
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(job.id);
    }
  };

  return (
    <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {job.name}
              </h3>
              {!job.enabled && (
                <Badge variant="outline" className="text-xs text-zinc-500">
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {formatSchedule(job.schedule.expr)}
            </p>
          </div>
          {getStatusIcon(job.state.lastStatus)}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Next:</span>{' '}
              <span className={job.enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}>
                {getTimeUntil(job.state.nextRunAtMs)}
              </span>
            </div>
            {job.state.lastRunAtMs && (
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Last:</span>{' '}
                <span className="text-zinc-900 dark:text-zinc-100">
                  {getTimeAgo(job.state.lastRunAtMs)}
                </span>
              </div>
            )}
            {job.state.lastDurationMs !== undefined && (
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Duration:</span>{' '}
                <span className="text-zinc-900 dark:text-zinc-100">
                  {(job.state.lastDurationMs / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showHistory && onViewHistory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleViewHistory}
                title="View history"
              >
                <Clock className="h-3 w-3" />
              </Button>
            )}
            {job.enabled && onRunNow && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleRunNow}
                title="Run now"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs ${
                  job.enabled
                    ? "text-zinc-500 hover:text-red-600"
                    : "text-zinc-500 hover:text-green-600"
                }`}
                onClick={handleToggle}
                title={job.enabled ? "Disable" : "Enable"}
              >
                <Power className={`h-3 w-3 ${job.enabled ? "" : "text-zinc-400"}`} />
              </Button>
            )}
          </div>
        </div>

        {job.state.lastStatus === 'error' && job.state.lastError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded p-2">
            {job.state.lastError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
