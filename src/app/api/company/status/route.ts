import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const SHARED = process.env.HOME ? join(process.env.HOME, "shared") : "/Users/paulvillanueva/shared";
const MEETINGS_DIR = join(SHARED, "meetings");
const ACTIONS_FILE = join(SHARED, "action-items.json");
const RELATIONSHIPS_DIR = join(SHARED, "relationships");
const ACTIVITY_FILE = join(SHARED, "activity-feed.json");

function safeRead(path: string, fallback: string = "[]") {
  try { return readFileSync(path, "utf-8"); } catch { return fallback; }
}

export async function GET() {
  // Aggregate company health metrics
  const actions = JSON.parse(safeRead(ACTIONS_FILE, "[]"));
  const openActions = actions.filter((a: { status: string }) => a.status !== "done");
  const doneActions = actions.filter((a: { status: string }) => a.status === "done");
  const overdueActions = actions.filter((a: { status: string; deadline?: string }) => {
    if (a.status === "done") return false;
    if (!a.deadline) return false;
    return new Date(a.deadline) < new Date();
  });

  // Meetings
  let meetingCount = 0;
  let lastMeeting: string | null = null;
  try {
    const files = readdirSync(MEETINGS_DIR).filter(f => f.endsWith(".md")).sort().reverse();
    meetingCount = files.length;
    if (files[0]) lastMeeting = files[0].replace(".md", "");
  } catch { /* no meetings */ }

  // Relationships — avg trust
  let avgTrust = 50;
  try {
    const files = readdirSync(RELATIONSHIPS_DIR).filter(f => f.endsWith(".json"));
    let total = 0, count = 0;
    files.forEach(f => {
      const data = JSON.parse(readFileSync(join(RELATIONSHIPS_DIR, f), "utf-8"));
      Object.values(data.relationships || {}).forEach((r: unknown) => {
        const rel = r as { trust: number };
        total += rel.trust;
        count++;
      });
    });
    if (count > 0) avgTrust = Math.round(total / count);
  } catch { /* */ }

  // Activity feed — recent
  const activityFeed = JSON.parse(safeRead(ACTIVITY_FILE, '{"entries":[]}'));
  const activity = activityFeed.entries || [];
  const recentActivity = activity.slice(0, 10);

  // Agent last activity (from activity feed)
  const agentLastSeen: Record<string, string> = {};
  activity.forEach((a: { agent?: string; timestamp?: string }) => {
    if (a.agent && a.timestamp && !agentLastSeen[a.agent]) {
      agentLastSeen[a.agent] = a.timestamp;
    }
  });

  // Compute health score (0-100)
  const actionScore = openActions.length === 0 ? 100 : Math.max(0, 100 - overdueActions.length * 20);
  const meetingScore = meetingCount > 0 ? Math.min(100, meetingCount * 15) : 0;
  const trustScore = avgTrust;
  const healthScore = Math.round((actionScore * 0.3) + (meetingScore * 0.3) + (trustScore * 0.4));

  return NextResponse.json({
    health: {
      score: healthScore,
      breakdown: {
        actions: actionScore,
        meetings: meetingScore,
        trust: trustScore,
      }
    },
    actions: {
      open: openActions.length,
      done: doneActions.length,
      overdue: overdueActions.length,
    },
    meetings: {
      total: meetingCount,
      last: lastMeeting,
    },
    trust: {
      average: avgTrust,
    },
    agentLastSeen,
    recentActivity,
  });
}
