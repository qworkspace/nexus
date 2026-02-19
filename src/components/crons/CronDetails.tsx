"use client";

import { CronJob } from "@/lib/cron-mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CronDetailsProps {
  job: CronJob | null;
}

export function CronDetails({ job }: CronDetailsProps) {
  if (!job) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-zinc-500">Select a cron job to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{job.name}</CardTitle>
              <p className="text-sm text-zinc-500 mt-1">{job.schedule.expr}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={job.lastStatus} enabled={job.enabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Timezone</span>
            <span className="font-medium text-zinc-900">{job.schedule.tz}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Next run</span>
            <span className="font-medium text-zinc-900">
              {formatDateTime(job.nextRunAt)}
            </span>
          </div>
          {job.lastRunAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Last run</span>
              <span className="font-medium text-zinc-900">
                {formatDateTime(job.lastRunAt)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-50 rounded-lg p-3 font-mono text-sm">
            <div className="text-zinc-600">
              <span className="text-zinc-400">kind:</span> {job.payload.kind}
            </div>
            <div className="text-zinc-600 mt-1">
              <span className="text-zinc-400">message:</span> {job.payload.message}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {job.runHistory.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">No runs yet</p>
          ) : (
            <div className="space-y-2">
              {job.runHistory.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-3 py-2 border-b border-zinc-100 last:border-0"
                >
                  <StatusDot status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {run.status === 'ok' ? 'Success' : 'Failed'}
                      </p>
                      {run.duration && (
                        <span className="text-xs text-zinc-500">
                          {formatDuration(run.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {formatRelativeTime(run.timestamp)}
                    </p>
                    {run.error && (
                      <p className="text-xs text-red-600 mt-1">{run.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            Run Now
          </button>
          <button className={cn(
            "w-full px-4 py-2 border text-sm font-medium rounded-lg transition-colors",
            job.enabled
              ? "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          )}>
            {job.enabled ? 'Disable' : 'Enable'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status, enabled }: { status: 'ok' | 'error' | null; enabled: boolean }) {
  if (!enabled) {
    return (
      <span className="px-2 py-1 bg-zinc-200 text-zinc-600 text-xs font-medium rounded-full">
        Disabled
      </span>
    );
  }

  if (!status) {
    return (
      <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full">
        Never run
      </span>
    );
  }

  const variants = {
    ok: "bg-zinc-100 text-zinc-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", variants[status])}>
      {status === 'ok' ? 'OK' : 'Error'}
    </span>
  );
}

function StatusDot({ status }: { status: 'ok' | 'error' }) {
  const colors = {
    ok: "bg-zinc-800",
    error: "bg-red-500",
  };

  return <span className={cn("w-2 h-2 rounded-full", colors[status])} />;
}

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return d.toLocaleDateString('en-US', options);
}

function formatRelativeTime(date: Date): string {
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
