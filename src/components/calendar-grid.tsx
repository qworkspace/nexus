"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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

interface CalendarGridProps {
  weekStart: Date;
  events: CalendarEvent[];
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const jobColors: Record<string, string> = {
  "morning-brief": "bg-zinc-100 border-zinc-300 text-[#FFE135]",
  "morning-mode": "bg-zinc-100 border-zinc-300 text-zinc-800",
  "discord-digest-morning": "bg-zinc-100 border-zinc-300 text-zinc-700",
  "discord-digest-evening": "bg-zinc-100 border-zinc-300 text-zinc-700",
  "night-mode": "bg-zinc-100 border-zinc-300 text-zinc-700",
  "dj-discovery": "bg-pink-100 border-pink-300 text-pink-800",
};

export function CalendarGrid({ weekStart, events }: CalendarGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Generate array of dates for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const today = new Date();

  // Group events by day and hour
  const eventsByDayHour: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const eventDate = new Date(event.datetime);
    const dayIndex = weekDays.findIndex((d) => isSameDay(d, eventDate));
    if (dayIndex >= 0) {
      const key = `${dayIndex}-${event.hour}`;
      if (!eventsByDayHour[key]) eventsByDayHour[key] = [];
      eventsByDayHour[key].push(event);
    }
  });

  return (
    <>
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        {/* Header row with day names */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-zinc-50 border-b border-zinc-200">
          <div className="p-2 border-r border-zinc-200"></div>
          {weekDays.map((date, i) => (
            <div
              key={i}
              className={cn(
                "p-2 text-center border-r border-zinc-200 last:border-r-0",
                isSameDay(date, today) && "bg-zinc-900 text-white"
              )}
            >
              <div className="text-xs font-medium">{dayNames[date.getDay()]}</div>
              <div className="text-lg font-semibold">{date.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-100 last:border-b-0"
            >
              {/* Hour label */}
              <div className="p-1 text-xs text-zinc-400 text-right pr-2 border-r border-zinc-100">
                {formatHour(hour)}
              </div>

              {/* Day cells */}
              {weekDays.map((_, dayIndex) => {
                const cellEvents = eventsByDayHour[`${dayIndex}-${hour}`] || [];
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "min-h-[40px] p-0.5 border-r border-zinc-100 last:border-r-0",
                      isSameDay(weekDays[dayIndex], today) && "bg-zinc-50"
                    )}
                  >
                    {cellEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "w-full text-left text-xs p-1 rounded border mb-0.5 truncate hover:opacity-80 transition-opacity",
                          jobColors[event.jobId] || "bg-zinc-100 border-zinc-300 text-zinc-800"
                        )}
                      >
                        {event.name}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-zinc-500">Scheduled time</span>
              <p className="font-medium">
                {selectedEvent &&
                  new Date(selectedEvent.datetime).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Cron expression</span>
              <Badge variant="secondary" className="ml-2 font-mono">
                {selectedEvent?.schedule}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Job ID</span>
              <p className="font-mono text-sm">{selectedEvent?.jobId}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
