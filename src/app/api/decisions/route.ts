import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { Decision, DecisionStats } from "@/types/decision";

const execAsync = promisify(exec);

const AUDIT_FILE_PATH = path.join(
  process.env.HOME || "",
  ".openclaw/workspace/data/decisions/audit.json"
);

async function getDecisions(): Promise<Decision[]> {
  // Try reading from audit.json first
  try {
    const data = await fs.readFile(AUDIT_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    // Fallback: try q-audit export
    try {
      const { stdout } = await execAsync("q-audit export --format json");
      const decisions = JSON.parse(stdout);
      // Cache for next time
      await fs.mkdir(path.dirname(AUDIT_FILE_PATH), { recursive: true });
      await fs.writeFile(AUDIT_FILE_PATH, JSON.stringify(decisions, null, 2));
      return decisions;
    } catch {
      // Return empty array if both fail
      return [];
    }
  }
}

function calculateStats(decisions: Decision[]): DecisionStats {
  const total = decisions.length;
  
  let successCount = 0;
  let failCount = 0;
  let pendingCount = 0;
  let totalConfidence = 0;
  const actionCounts: Record<string, number> = {};
  const agents = new Set<string>();
  const actionTypes = new Set<string>();

  for (const d of decisions) {
    // Count outcomes
    if (!d.outcome) {
      pendingCount++;
    } else if (d.outcome.matched) {
      successCount++;
    } else {
      failCount++;
    }

    // Sum confidence
    totalConfidence += d.decision.confidence;

    // Track actions
    const action = d.decision.action;
    actionCounts[action] = (actionCounts[action] || 0) + 1;
    actionTypes.add(action);

    // Track agents
    agents.add(d.agent);
  }

  // Calculate common actions sorted by count
  const commonActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    successCount,
    failCount,
    pendingCount,
    successRate: total > 0 ? (successCount / (successCount + failCount)) * 100 || 0 : 0,
    avgConfidence: total > 0 ? totalConfidence / total : 0,
    commonActions,
    agents: Array.from(agents).sort(),
    actionTypes: Array.from(actionTypes).sort(),
  };
}

function filterDecisions(
  decisions: Decision[],
  params: {
    dateRange?: string;
    agent?: string;
    action?: string;
    outcome?: string;
  }
): Decision[] {
  let filtered = [...decisions];

  // Date range filter
  if (params.dateRange && params.dateRange !== "all") {
    const now = Date.now();
    let cutoff: number;
    
    if (params.dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      cutoff = today.getTime();
    } else if (params.dateRange === "week") {
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else {
      cutoff = 0;
    }

    filtered = filtered.filter((d) => d.timestamp * 1000 >= cutoff);
  }

  // Agent filter
  if (params.agent && params.agent !== "all") {
    filtered = filtered.filter((d) => d.agent === params.agent);
  }

  // Action filter
  if (params.action && params.action !== "all") {
    filtered = filtered.filter((d) => d.decision.action === params.action);
  }

  // Outcome filter
  if (params.outcome && params.outcome !== "all") {
    filtered = filtered.filter((d) => {
      if (params.outcome === "pending") return !d.outcome;
      if (params.outcome === "success") return d.outcome?.matched === true;
      if (params.outcome === "failed") return d.outcome?.matched === false;
      return true;
    });
  }

  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  return filtered;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateRange = searchParams.get("dateRange") || "all";
  const agent = searchParams.get("agent") || "all";
  const action = searchParams.get("action") || "all";
  const outcome = searchParams.get("outcome") || "all";

  try {
    const allDecisions = await getDecisions();
    const filteredDecisions = filterDecisions(allDecisions, {
      dateRange,
      agent,
      action,
      outcome,
    });
    const stats = calculateStats(allDecisions);

    return NextResponse.json({
      decisions: filteredDecisions,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions", decisions: [], stats: null },
      { status: 500 }
    );
  }
}
