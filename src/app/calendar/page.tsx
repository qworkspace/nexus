"use client";

import { useState, useEffect } from "react";
import { CalendarGrid } from "@/components/calendar-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEvent {
  id: string;
  jobId: string;
  name: string;
  schedule: string;
  datetime: string;
  hour: number;
  minute: number;
  dayOfWeek: number;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day); // Go to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
  const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${year}`;
  }
  return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const from = weekStart.toISOString();
        const to = getWeekEnd(weekStart).toISOString();
        const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [weekStart]);

  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  const isCurrentWeek =
    getWeekStart(new Date()).getTime() === weekStart.getTime();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Scheduled cron jobs and recurring tasks
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            ← Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            disabled={isCurrentWeek}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next →
          </Button>
        </div>

        <h2 className="text-lg font-medium text-zinc-900">
          {formatWeekRange(weekStart)}
        </h2>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <CalendarGrid weekStart={weekStart} events={events} />
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-xs">
            <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300"></span>
            Morning Brief
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300"></span>
            Morning Mode
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300"></span>
            Discord Digest
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300"></span>
            Night Mode
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300"></span>
            DJ Discovery
          </span>
        </div>
      </div>
    </div>
  );
}
