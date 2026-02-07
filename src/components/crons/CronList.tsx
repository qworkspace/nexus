"use client";

import { CronJob } from "@/lib/cron-mock";
import { describeCronExpression } from "@/lib/cron-parser";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CronListProps {
  jobs: CronJob[];
  selectedJob: CronJob | null;
  onSelectJob: (job: CronJob) => void;
}

export function CronList({ jobs, selectedJob, onSelectJob }: CronListProps) {
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <Card
          key={job.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedJob?.id === job.id
              ? "ring-2 ring-zinc-900 bg-zinc-50"
              : ""
          )}
          onClick={() => onSelectJob(job)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={job.lastStatus} enabled={job.enabled} />
                <div>
                  <h3 className="font-medium text-zinc-900">{job.name}</h3>
                  <p className="text-xs text-zinc-500">
                    {describeCronExpression(job.schedule.expr)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Next run</p>
                <p className="text-sm font-medium text-zinc-900">
                  {formatRelativeTime(job.nextRunAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusDot({ status, enabled }: { status: 'ok' | 'error' | null; enabled: boolean }) {
  if (!enabled) {
    return <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />;
  }

  if (!status) {
    return <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />;
  }

  const colors = {
    ok: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <span className={cn("w-2.5 h-2.5 rounded-full", colors[status])} />
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 0) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}
