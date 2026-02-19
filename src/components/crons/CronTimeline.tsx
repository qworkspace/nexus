"use client";

import { CronJob } from "@/lib/cron-mock";
import { getOccurrencesInRange } from "@/lib/cron-parser";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CronTimelineProps {
  jobs: CronJob[];
}

export function CronTimeline({ jobs }: CronTimelineProps) {
  const enabledJobs = jobs.filter(job => job.enabled);
  
  // Get 24-hour timeline
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const jobOccurrences = enabledJobs.map(job => ({
    job,
    occurrences: getOccurrencesInRange(job.schedule.expr, startOfDay, endOfDay)
  }));

  // Flatten and sort all occurrences
  const allOccurrences = jobOccurrences
    .flatMap(({ job, occurrences }) =>
      occurrences.map(occ => ({ job, occurrence: occ }))
    )
    .sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime());

  // Generate 24 hours of time slots
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const hourOccurrences = allOccurrences.filter(
      ({ occurrence }) => occurrence.getHours() === hour
    );

    return {
      hour,
      occurrences: hourOccurrences,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">24-Hour Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hours.map(({ hour, occurrences }) => (
            <div key={hour} className="flex items-center gap-3">
              <div className="w-14 text-xs text-muted-foreground text-right">
                {formatHour(hour)}
              </div>
              <div className="flex-1 h-8 bg-zinc-50 rounded-lg border border-zinc-200 relative overflow-hidden">
                {occurrences.map(({ job, occurrence }, idx) => {
                  const minutes = occurrence.getMinutes();
                  const left = (minutes / 60) * 100;
                  
                  return (
                    <div
                      key={`${job.id}-${idx}`}
                      className={cn(
                        "absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform",
                        job.lastStatus === 'ok' && 'bg-green-500',
                        job.lastStatus === 'error' && 'bg-red-500',
                        !job.lastStatus && 'bg-zinc-400'
                      )}
                      style={{
                        left: `calc(${left}% - 6px)`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                      title={`${job.name} at ${formatTime(occurrence)}`}
                    />
                  );
                })}
              </div>
              <div className="w-32 flex flex-wrap gap-1">
                {occurrences.length > 3 ? (
                  <span className="text-xs text-muted-foreground">
                    +{occurrences.length} jobs
                  </span>
                ) : (
                  occurrences.map(({ job }) => (
                    <span
                      key={job.id}
                      className="text-xs text-muted-foreground truncate"
                    >
                      {job.name.slice(0, 8)}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
}

function formatTime(date: Date): string {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
