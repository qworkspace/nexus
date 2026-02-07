"use client";

import useSWR from 'swr';
import { fetcher, OpenClawSessionsResponse, transformSession } from '@/lib/openclaw-client';

export interface LiveSession {
  key: string;
  displayName: string;
  kind: "main" | "spawn" | "cron";
  agent: string;
  agentEmoji: string;
  model: string;
  status: "active" | "building" | "complete" | "error";
  tokenUsage: number;
  duration: number; // seconds
  lastMessage: string;
  task?: string;
  startedAt: Date;
  updatedAt: Date;
}

export function useOpenClawSessions(filter: "all" | "main" | "agents" | "crons" = "all") {
  const { data, error, isLoading, mutate } = useSWR<OpenClawSessionsResponse>(
    '/api/openclaw/sessions',
    (url: string) => fetcher<OpenClawSessionsResponse>(url),
    {
      refreshInterval: 10000, // 10-second auto-refresh
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Transform sessions
  const sessions = data?.data?.sessions
    ? data.data.sessions.map(transformSession)
    : [];

  // Filter sessions based on filter parameter
  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    if (filter === "main") return session.kind === "main";
    if (filter === "agents") return session.kind === "spawn";
    if (filter === "crons") return session.kind === "cron";
    return true;
  });

  const activeCount = sessions.filter((s) => s.status === "active" || s.status === "building").length;
  const totalSessions = sessions.length;
  const lastUpdated = new Date();

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    lastUpdated,
    activeCount,
    totalSessions,
    isLoading,
    error: error || data?.error,
    source: data?.source,
    mutate,
  };
}
