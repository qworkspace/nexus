"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetchOpenClawCrons,
  transformCronJob,
  OpenClawCronsResponse,
  OpenClawStatusResponse,
  fetchOpenClawCronRuns,
  transformCronRun,
} from "@/lib/openclaw-client";

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
  schedule: string;
  enabled: boolean;
}

export interface CronRun {
  ts: number;
  jobId: string;
  action: string;
  status: string;
  runAt: Date;
  durationMs: number;
  nextRunAt?: Date;
}

// Fallback mock data
const MOCK_CRONS: CronJob[] = [
  {
    id: "cron-failure-monitor",
    name: "Cron Failure Monitor",
    time: "16:30",
    status: "pending",
    expectedDuration: 60,
    description: "Check for failed cron jobs and alert",
    schedule: "*/30 * * * *",
    enabled: true,
  },
  {
    id: "discord-digest-evening",
    name: "Discord Digest (Evening)",
    time: "18:17",
    status: "pending",
    expectedDuration: 30,
    description: "Generate and send evening digest to Discord",
    schedule: "17 18 * * *",
    enabled: true,
  },
  {
    id: "riddle-answer-reveal",
    name: "Riddle Answer Reveal",
    time: "18:22",
    status: "pending",
    expectedDuration: 20,
    description: "Reveal answer to daily riddle",
    schedule: "22 18 * * *",
    enabled: true,
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
    schedule: "7 16 * * *",
    enabled: true,
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
    schedule: "*/30 * * * *",
    enabled: true,
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
    schedule: "13 15 * * *",
    enabled: true,
  },
];

export function useCrons() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [useMock, setUseMock] = useState(false);
  const [cronRunsCache, setCronRunsCache] = useState<Record<string, CronRun[]>>({});

  // Fetch OpenClaw status
  const { data: statusData } = useSWR<OpenClawStatusResponse>(
    '/api/openclaw/status',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  // Fetch crons data
  const { data: cronsData, error, isLoading } = useSWR<OpenClawCronsResponse>(
    statusData?.online && !useMock ? '/api/openclaw/crons' : null,
    fetchOpenClawCrons,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
      onError: (err) => {
        console.error('Error fetching crons:', err);
        if (process.env.NODE_ENV === 'development') {
          setUseMock(true);
        }
      },
    }
  );

  // Update lastUpdated when data changes
  useEffect(() => {
    if (cronsData || error) {
      setLastUpdated(new Date());
    }
  }, [cronsData, error]);

  // Transform crons
  let crons: CronJob[];
  let source: 'live' | 'mock' | 'error';

  if (useMock || (!cronsData && !isLoading)) {
    crons = MOCK_CRONS;
    source = 'mock';
  } else if (cronsData && cronsData.jobs) {
    // Transform and add next run times
    const now = new Date();
    crons = cronsData.jobs.map(job => {
      const transformed = transformCronJob(job);
      
      // Calculate next run time
      const [hours, minutes] = transformed.time.split(":").map(Number);
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      return {
        ...transformed,
        nextRun: transformed.status === "pending" ? nextRun : transformed.nextRun,
      };
    });
    source = 'live';
  } else {
    crons = [];
    source = 'error';
  }

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

  // Function to fetch run history for a specific cron
  const fetchRuns = async (jobId: string): Promise<CronRun[]> => {
    // Check cache first
    if (cronRunsCache[jobId]) {
      return cronRunsCache[jobId];
    }

    try {
      const data = await fetchOpenClawCronRuns(jobId, 10);
      const runs = data.entries.map(transformCronRun);
      
      // Update cache
      setCronRunsCache(prev => ({ ...prev, [jobId]: runs }));
      
      return runs;
    } catch (error) {
      console.error(`Error fetching runs for job ${jobId}:`, error);
      return [];
    }
  };

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
    source,
    isLoading,
    error,
    gatewayOnline: statusData?.online ?? false,
    fetchRuns,
  };
}

// Helper fetcher function
async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
