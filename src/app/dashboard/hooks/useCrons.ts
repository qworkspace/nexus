"use client";

import { useState, useEffect } from "react";

export interface CronJob {
  id: string;
  name: string;
  time: string; // HH:mm format
  nextRun?: Date;
  lastRun?: Date;
  status: "pending" | "success" | "slow" | "error";
  duration?: number; // seconds
  expectedDuration?: number; // seconds
  description?: string;
}

const MOCK_CRONS: CronJob[] = [
  {
    id: "cron-failure-monitor",
    name: "Cron Failure Monitor",
    time: "16:30",
    status: "pending",
    expectedDuration: 60,
    description: "Check for failed cron jobs and alert",
  },
  {
    id: "discord-digest-evening",
    name: "Discord Digest (Evening)",
    time: "18:17",
    status: "pending",
    expectedDuration: 30,
    description: "Generate and send evening digest to Discord",
  },
  {
    id: "riddle-answer-reveal",
    name: "Riddle Answer Reveal",
    time: "18:22",
    status: "pending",
    expectedDuration: 20,
    description: "Reveal answer to daily riddle",
  },
  {
    id: "afternoon-joke",
    name: "Afternoon Joke",
    time: "16:07",
    status: "success",
    lastRun: new Date(Date.now() - 16 * 1000),
    duration: 16,
    expectedDuration: 20,
    description: "Send afternoon joke",
  },
  {
    id: "cron-failure-monitor-previous",
    name: "Cron Failure Monitor",
    time: "16:00",
    status: "success",
    lastRun: new Date(Date.now() - 7 * 60 * 1000),
    duration: 60,
    expectedDuration: 60,
    description: "Check for failed cron jobs and alert",
  },
  {
    id: "wellness-afternoon",
    name: "Wellness Check (Afternoon)",
    time: "15:13",
    status: "success",
    lastRun: new Date(Date.now() - 54 * 60 * 1000),
    duration: 26,
    expectedDuration: 30,
    description: "Afternoon wellness check",
  },
];

export function useCrons() {
  const [crons, setCrons] = useState<CronJob[]>(MOCK_CRONS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Calculate next run times for upcoming crons
  useEffect(() => {
    const updateNextRuns = () => {
      const now = new Date();

      setCrons((prev) =>
        prev.map((cron) => {
          const [hours, minutes] = cron.time.split(":").map(Number);
          
          // Calculate next run time
          const nextRun = new Date(now);
          nextRun.setHours(hours, minutes, 0, 0);
          
          if (nextRun <= now) {
            // Already passed today, schedule for tomorrow
            nextRun.setDate(nextRun.getDate() + 1);
          }
          
          return {
            ...cron,
            nextRun: cron.status === "pending" ? nextRun : cron.nextRun,
          };
        })
      );
    };

    updateNextRuns();

    // Update every minute to refresh next run times
    const interval = setInterval(() => {
      updateNextRuns();
      setLastUpdated(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Split into upcoming and recent
  const upcoming = crons.filter((c) => c.status === "pending");
  const recent = crons.filter((c) => c.status !== "pending");

  // Calculate time until next run
  const getNextRunTime = (): { time: string; job: string } | null => {
    const pending = crons.filter((c) => c.status === "pending" && c.nextRun);
    if (pending.length === 0) return null;

    const next = pending.reduce((earliest, current) => {
      if (!earliest.nextRun) return current;
      if (!current.nextRun) return earliest;
      return current.nextRun < earliest.nextRun ? current : earliest;
    }, pending[0]);

    if (!next || !next.nextRun) return null;

    const diffMs = next.nextRun.getTime() - Date.now();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return { time: `${diffMins}m`, job: next.name };
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return { time: `${hours}h ${mins}m`, job: next.name };
  };

  const nextRun = getNextRunTime();
  const failureCount = recent.filter((c) => c.status === "error").length;
  const slowCount = recent.filter((c) => c.status === "slow").length;

  return {
    crons,
    upcoming,
    recent,
    lastUpdated,
    totalCrons: crons.length,
    ranToday: recent.length,
    failures: failureCount,
    slow: slowCount,
    nextRun,
    healthStatus: failureCount > 0 ? "error" : slowCount > 0 ? "warning" : "ok",
  };
}
