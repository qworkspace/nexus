"use client";

import useSWR from 'swr';
import { fetcher, OpenClawCronsResponse, transformCron } from '@/lib/openclaw-client';

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

export function useOpenClawCrons() {
  const { data, error, isLoading, mutate } = useSWR<OpenClawCronsResponse>(
    '/api/openclaw/crons',
    fetcher as (url: string) => Promise<OpenClawCronsResponse>,
    {
      refreshInterval: 30000, // 30-second auto-refresh
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Transform crons
  const crons = data?.data?.jobs
    ? data.data.jobs.map(transformCron)
    : [];

  // Calculate time until next run
  const getNextRunTime = (): { time: string; job: string } | null => {
    const now = Date.now();
    const pending = crons.filter((c) => {
      if (!c.nextRun) return false;
      return c.nextRun.getTime() > now;
    });

    if (pending.length === 0) return null;

    const next = pending.reduce((earliest, current) => {
      if (!earliest.nextRun) return current;
      if (!current.nextRun) return earliest;
      return current.nextRun.getTime() < earliest.nextRun.getTime() ? current : earliest;
    }, pending[0]);

    if (!next || !next.nextRun) return null;

    const diffMs = next.nextRun.getTime() - now;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return { time: `${diffMins}m`, job: next.name };
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return { time: `${hours}h ${mins}m`, job: next.name };
  };

  const nextRun = getNextRunTime();
  const failureCount = crons.filter((c) => c.status === "error").length;
  const slowCount = crons.filter((c) => c.status === "slow").length;

  // Split into upcoming and recent
  const upcoming = crons.filter((c) => c.nextRun && c.nextRun.getTime() > Date.now());
  const recent = crons.filter((c) => c.nextRun && c.nextRun.getTime() <= Date.now());

  const lastUpdated = new Date();

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
    isLoading,
    error: error || data?.error,
    source: data?.source,
    mutate,
  };
}
