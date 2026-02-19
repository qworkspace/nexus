import { NextResponse } from "next/server";
import { exec } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  agent?: string;
  agentName?: string;
  emoji: string;
  message: string;
  metadata: Record<string, unknown>;
}

interface RecentSession {
  key: string;
  age: number;
}

// Get gateway token from config or env
function getGatewayToken(): string {
  if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    return process.env.OPENCLAW_GATEWAY_TOKEN;
  }

  // Fallback: read from openclaw config
  try {
    const configPath = process.env.HOME ? join(process.env.HOME, ".openclaw", "openclaw.json") : join("/Users/paulvillanueva", ".openclaw", "openclaw.json");
    const config = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(config);
    return parsed.gateway?.auth?.token || '';
  } catch {
    return '';
  }
}

// Map agent IDs to their current tasks based on session type and activity
function inferAgentActivity(
  agentId: string,
  recentSessions: RecentSession[],
  activityFeed: ActivityEntry[]
): { state: "working" | "idle" | "meeting"; activity: string; lastActive: string } {
  const ACTIVE_THRESHOLD_MS = 60000; // 1 minute = working
  const IDLE_THRESHOLD_MS = 300000; // 5 minutes = idle

  // Check if agent has recent activity
  const hasRecentSession = recentSessions.length > 0 && recentSessions[0].age < ACTIVE_THRESHOLD_MS;
  const hasIdleSession = recentSessions.length > 0 && recentSessions[0].age < IDLE_THRESHOLD_MS;

  // Check activity feed for recent action
  const recentActivity = activityFeed
    .filter(a => a.agent === agentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const lastActive = recentActivity?.timestamp || new Date().toISOString();

  // Default idle activities per agent
  const idleActivities: Record<string, string> = {
    main: "Coordinating team",
    creative: "Designing campaign",
    design: "UI polish",
    growth: "Analysing metrics",
    research: "Market intel",
    dev: "Writing code",
    testing: "Running tests",
    events: "Event planning",
    support: "Resolving tickets",
    luna: "Discord monitoring",
    ella: "Creating artwork",
    arty: "Ella's schedule",
  };

  if (!hasRecentSession && !hasIdleSession) {
    return {
      state: "idle",
      activity: idleActivities[agentId] || "idle",
      lastActive,
    };
  }

  // Infer activity from session key
  const sessionKey = recentSessions[0]?.key || "";
  let activity = idleActivities[agentId] || "Working...";

  if (sessionKey.includes("main:main") && agentId === "main") {
    activity = "Coordinating team";
  } else if (sessionKey.includes("dev:subagent") && agentId === "dev") {
    activity = "Building CryptoMon";
  } else if (sessionKey.includes("cron")) {
    // Extract cron job info if possible
    if (sessionKey.includes("standup")) {
      return { state: "meeting", activity: "In standup", lastActive };
    }
    activity = "Running background task";
  } else if (recentActivity?.type === "meeting") {
    return { state: "meeting", activity: "In meeting", lastActive };
  }

  return {
    state: "working",
    activity,
    lastActive,
  };
}

export async function GET() {
  try {
    const token = getGatewayToken();
    if (!token) {
      throw new Error("No gateway token available");
    }

    // Call gateway health command
    const { stdout } = await execAsync(
      `openclaw gateway call health --json --token ${token}`,
      { timeout: 10000 }
    );

    const healthData = JSON.parse(stdout);
    const agents = healthData.agents || [];

    // Load activity feed for additional context
    let activityFeed: ActivityEntry[] = [];
    try {
      const sharedPath = process.env.HOME ? join(process.env.HOME, ".openclaw/shared") : "/Users/paulvillanueva/.openclaw/shared";
      const activityPath = join(sharedPath, "activity-feed.json");
      const activityData = JSON.parse(readFileSync(activityPath, "utf-8"));
      activityFeed = activityData.entries || [];
    } catch {
      // Activity feed load fails, continue without it
    }

    // Map agent status
    const status: Record<string, { state: "working" | "idle" | "meeting"; activity: string; lastActive: string }> = {};

    agents.forEach((agent: { agentId: string; sessions?: { recent?: RecentSession[] } }) => {
      const recentSessions = agent.sessions?.recent || [];
      const agentStatus = inferAgentActivity(agent.agentId, recentSessions, activityFeed);
      status[agent.agentId] = agentStatus;
    });

    // Add Luna, Ella, Arty (not in gateway but in roster)
    status["luna"] = {
      state: "idle" as const,
      activity: "Discord monitoring",
      lastActive: new Date().toISOString(),
    };
    status["ella"] = {
      state: "idle" as const,
      activity: "Creating artwork",
      lastActive: new Date().toISOString(),
    };
    status["arty"] = {
      state: "idle" as const,
      activity: "Ella's schedule",
      lastActive: new Date().toISOString(),
    };

    return NextResponse.json({ agents: status });
  } catch (error) {
    console.error("Agent status error:", error);

    // Return graceful fallback - all agents idle
    const fallbackStatus: Record<string, { state: "working" | "idle" | "meeting"; activity: string; lastActive: string }> = {
      main: { state: "idle", activity: "Coordinating team", lastActive: new Date().toISOString() },
      creative: { state: "idle", activity: "Designing campaign", lastActive: new Date().toISOString() },
      design: { state: "idle", activity: "UI polish", lastActive: new Date().toISOString() },
      growth: { state: "idle", activity: "Analysing metrics", lastActive: new Date().toISOString() },
      research: { state: "idle", activity: "Market intel", lastActive: new Date().toISOString() },
      dev: { state: "idle", activity: "Writing code", lastActive: new Date().toISOString() },
      testing: { state: "idle", activity: "Running tests", lastActive: new Date().toISOString() },
      events: { state: "idle", activity: "Event planning", lastActive: new Date().toISOString() },
      support: { state: "idle", activity: "Resolving tickets", lastActive: new Date().toISOString() },
      luna: { state: "idle", activity: "Discord monitoring", lastActive: new Date().toISOString() },
      ella: { state: "idle", activity: "Creating artwork", lastActive: new Date().toISOString() },
      arty: { state: "idle", activity: "Ella's schedule", lastActive: new Date().toISOString() },
    };

    return NextResponse.json({ agents: fallbackStatus, offline: true });
  }
}
