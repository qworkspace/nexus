"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetchOpenClawSessions,
  transformSession,
  OpenClawSessionsResponse,
  OpenClawStatusResponse,
} from "@/lib/openclaw-client";

export interface LiveSession {
  key: string;
  displayName: string;
  kind: "main" | "spawn" | "cron" | "other";
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
  totalTokens: number;
}

// Fallback mock data for development
const MOCK_SESSIONS: LiveSession[] = [
  {
    key: "main-session-1",
    displayName: "Main Session (Q ↔ PJ)",
    kind: "main",
    agent: "Q",
    agentEmoji: "🦾",
    model: "opus",
    status: "active",
    tokenUsage: 45200,
    duration: 9240,
    lastMessage: "Got it. Mission Control + CryptoMon dashboard build started...",
    startedAt: new Date(Date.now() - 9240000),
    updatedAt: new Date(Date.now() - 120000),
    totalTokens: 45200,
  },
  {
    key: "dev-agent-1",
    displayName: "Dev Agent (cryptomon-market)",
    kind: "spawn",
    agent: "Dev",
    agentEmoji: "💻",
    model: "glm-4.7",
    status: "building",
    tokenUsage: 12100,
    duration: 263,
    lastMessage: "Building Market Overview dashboard components...",
    task: "Build Market Overview dashboard with mock data",
    startedAt: new Date(Date.now() - 263000),
    updatedAt: new Date(Date.now() - 5000),
    totalTokens: 12100,
  },
  {
    key: "cron-1",
    displayName: "Cron (Afternoon Joke)",
    kind: "cron",
    agent: "Q",
    agentEmoji: "🔄",
    model: "opus",
    status: "complete",
    tokenUsage: 1200,
    duration: 16,
    lastMessage: "Result: My DAW crashed, but at least I have a backup...",
    startedAt: new Date(Date.now() - 16000),
    updatedAt: new Date(Date.now() - 16000),
    totalTokens: 1200,
  },
];

export function useSessions(filter: "all" | "main" | "agents" | "crons" = "all") {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [useMock, setUseMock] = useState(false);

  // Fetch OpenClaw status to check if gateway is available
  const { data: statusData } = useSWR<OpenClawStatusResponse>(
    '/api/openclaw/status',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  // Fetch sessions data
  const { data: sessionsData, error, isLoading } = useSWR<OpenClawSessionsResponse>(
    statusData?.online && !useMock ? '/api/openclaw/sessions' : null,
    fetchOpenClawSessions,
    {
      refreshInterval: 10000, // 10-second refresh
      revalidateOnFocus: false,
      onError: (err) => {
        console.error('Error fetching sessions:', err);
        // Fall back to mock on error
        if (process.env.NODE_ENV === 'development') {
          setUseMock(true);
        }
      },
    }
  );

  // Update lastUpdated when data changes
  useEffect(() => {
    if (sessionsData || error) {
      setLastUpdated(new Date());
    }
  }, [sessionsData, error]);

  // Transform and filter sessions
  let sessions: LiveSession[];
  let source: 'live' | 'mock' | 'error';

  if (useMock || (!sessionsData && !isLoading)) {
    sessions = MOCK_SESSIONS;
    source = 'mock';
  } else if (sessionsData && sessionsData.sessions) {
    sessions = sessionsData.sessions.map(transformSession);
    source = 'live';
  } else {
    sessions = [];
    source = 'error';
  }

  // Filter sessions based on filter parameter
  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    if (filter === "main") return session.kind === "main";
    if (filter === "agents") return session.kind === "spawn";
    if (filter === "crons") return session.kind === "cron";
    return true;
  });

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    lastUpdated,
    activeCount: sessions.filter((s) => s.status === "active" || s.status === "building").length,
    totalSessions: sessions.length,
    source,
    isLoading,
    error,
    gatewayOnline: statusData?.online ?? false,
  };
}

// Helper fetcher function for SWR
async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
