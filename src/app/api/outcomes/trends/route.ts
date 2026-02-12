/**
 * Outcomes API - Trends Endpoint (OTF-001)
 * GET /api/outcomes/trends?days=14
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

interface DayTrend {
  date: string;
  count: number;
  time_saved_minutes: number;
  by_category: Record<string, number>;
}

interface TrendsResponse {
  days: number;
  daily: DayTrend[];
  weekly_average: number;
  top_categories: { category: string; count: number }[];
}

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

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDayTrend(date: string): DayTrend {
  const outcomesDir = getOutcomesDir();
  const filepath = join(outcomesDir, `${date}.jsonl`);
  const outcomes = parseOutcomeFile(filepath);

  const byCategory: Record<string, number> = {};
  let timeSaved = 0;

  for (const o of outcomes) {
    byCategory[o.category] = (byCategory[o.category] || 0) + 1;
    if (o.category === "time_saved" && o.unit === "minutes" && o.value) {
      timeSaved += o.value;
    }
  }

  return {
    date,
    count: outcomes.length,
    time_saved_minutes: timeSaved,
    by_category: byCategory,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "14", 10);

  try {
    const today = new Date();
    const daily: DayTrend[] = [];
    const categoryTotals: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const trend = getDayTrend(dateStr);
      daily.push(trend);

      // Aggregate category totals
      for (const [cat, count] of Object.entries(trend.by_category)) {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + count;
      }
    }

    // Calculate weekly average
    const totalCount = daily.reduce((sum, d) => sum + d.count, 0);
    const weeklyAverage = Math.round((totalCount / days) * 7 * 10) / 10;

    // Get top categories
    const topCategories = Object.entries(categoryTotals)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const response: TrendsResponse = {
      days,
      daily: daily.reverse(), // Oldest to newest
      weekly_average: weeklyAverage,
      top_categories: topCategories,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading trends:", error);
    return NextResponse.json(
      { error: "Failed to read trends" },
      { status: 500 }
    );
  }
}
