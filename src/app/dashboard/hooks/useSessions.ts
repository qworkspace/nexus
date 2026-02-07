"use client";

import { useState, useEffect } from "react";

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
    duration: 9240, // 2h 34m
    lastMessage: "Got it. Mission Control + CryptoMon dashboard build started...",
    task: undefined,
    startedAt: new Date(Date.now() - 9240000),
    updatedAt: new Date(Date.now() - 120000),
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
    duration: 263, // 4m 23s
    lastMessage: "Building Market Overview dashboard components...",
    task: "Build Market Overview dashboard with mock data",
    startedAt: new Date(Date.now() - 263000),
    updatedAt: new Date(Date.now() - 5000),
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
    task: "Send afternoon joke",
    startedAt: new Date(Date.now() - 16000),
    updatedAt: new Date(Date.now() - 16000),
  },
];

export function useSessions(filter: "all" | "main" | "agents" | "crons" = "all") {
  const [sessions, setSessions] = useState<LiveSession[]>(MOCK_SESSIONS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => {
        // Simulate dynamic token usage and duration updates
        return prev.map((session) => {
          if (session.status === "active" || session.status === "building") {
            const now = new Date();
            const newDuration = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
            const newTokenUsage = session.tokenUsage + Math.floor(Math.random() * 500);
            
            return {
              ...session,
              duration: newDuration,
              tokenUsage: newTokenUsage,
              updatedAt: now,
            };
          }
          return session;
        });
      });
      setLastUpdated(new Date());
    }, 10000); // 10-second refresh

    return () => clearInterval(interval);
  }, []);

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
  };
}
