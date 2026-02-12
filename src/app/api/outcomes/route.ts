/**
 * Outcomes API - Summary Endpoint (OTF-001)
 * GET /api/outcomes/summary?period=week&category=time_saved
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface Outcome {
  ts: string;
  datetime: string;
  category: string;
  description: string;
  value?: number;
  unit?: string;
  agent?: string;
  context?: Record<string, unknown>;
}

interface SummaryResponse {
  period: string;
  count: number;
  time_saved_minutes: number;
  by_category: Record<string, number>;
  by_agent: Record<string, number>;
}

// In-memory cache with 5-minute TTL
let cache: { data: SummaryResponse | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getOutcomesDir(): string {
  return join(homedir(), "shared", "logs", "outcomes");
}

function parseOutcomeFile(filepath: string): Outcome[] {
  if (!existsSync(filepath)) return [];
  try {
    const content = readFileSync(filepath, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function getDateRange(period: string): string[] {
  const today = new Date();
  const dates: string[] = [];

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  switch (period) {
    case "today":
      dates.push(formatDate(today));
      break;
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dates.push(formatDate(yesterday));
      break;
    case "week":
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
      }
      break;
    case "month":
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
      }
      break;
    default:
      dates.push(formatDate(today));
  }
  return dates;
}

function getOutcomes(period: string, category?: string): Outcome[] {
  const outcomesDir = getOutcomesDir();
  if (!existsSync(outcomesDir)) return [];

  const dates = getDateRange(period);
  const outcomes: Outcome[] = [];

  for (const date of dates) {
    const filepath = join(outcomesDir, `${date}.jsonl`);
    const dayOutcomes = parseOutcomeFile(filepath);
    outcomes.push(...dayOutcomes);
  }

  if (category) {
    return outcomes.filter((o) => o.category === category);
  }
  return outcomes;
}

function summarize(outcomes: Outcome[], period: string): SummaryResponse {
  const byCategory: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  let timeSaved = 0;

  for (const o of outcomes) {
    // Count by category
    byCategory[o.category] = (byCategory[o.category] || 0) + 1;

    // Count by agent
    const agent = o.agent || "unknown";
    byAgent[agent] = (byAgent[agent] || 0) + 1;

    // Sum time_saved in minutes
    if (o.category === "time_saved" && o.unit === "minutes" && o.value) {
      timeSaved += o.value;
    }
  }

  return {
    period,
    count: outcomes.length,
    time_saved_minutes: timeSaved,
    by_category: byCategory,
    by_agent: byAgent,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "today";
  const category = searchParams.get("category") || undefined;

  // Check cache (only for default queries)
  const cacheKey = `${period}:${category || "all"}`;
  const now = Date.now();

  if (
    cache.data &&
    now - cache.timestamp < CACHE_TTL_MS &&
    cacheKey === `${period}:${category || "all"}`
  ) {
    return NextResponse.json(cache.data);
  }

  try {
    const outcomes = getOutcomes(period, category);
    const summary = summarize(outcomes, period);

    // Update cache
    cache = { data: summary, timestamp: now };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error reading outcomes:", error);
    return NextResponse.json(
      { error: "Failed to read outcomes" },
      { status: 500 }
    );
  }
}
