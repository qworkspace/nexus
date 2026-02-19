/**
 * Outcomes API - Recent Endpoint (OTF-001)
 * GET /api/outcomes/recent?limit=20&category=time_saved
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
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

interface RecentResponse {
  outcomes: Outcome[];
  total: number;
  limit: number;
  category?: string;
}

function getOutcomesDir(): string {
  return join(homedir(), ".openclaw", "shared", "logs", "outcomes");
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

function getRecentOutcomes(limit: number, category?: string): Outcome[] {
  const outcomesDir = getOutcomesDir();
  if (!existsSync(outcomesDir)) return [];

  // Get all JSONL files sorted by date (newest first)
  const files = readdirSync(outcomesDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse();

  const outcomes: Outcome[] = [];

  for (const file of files) {
    if (outcomes.length >= limit) break;

    const filepath = join(outcomesDir, file);
    let dayOutcomes = parseOutcomeFile(filepath);

    if (category) {
      dayOutcomes = dayOutcomes.filter((o) => o.category === category);
    }

    // Add outcomes from newest to oldest within the day
    outcomes.push(...dayOutcomes.reverse());
  }

  // Sort by datetime descending and limit
  return outcomes
    .sort((a, b) => {
      const aTime = new Date(a.datetime).getTime();
      const bTime = new Date(b.datetime).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const category = searchParams.get("category") || undefined;

  try {
    const outcomes = getRecentOutcomes(limit, category);

    const response: RecentResponse = {
      outcomes,
      total: outcomes.length,
      limit,
      ...(category && { category }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading recent outcomes:", error);
    return NextResponse.json(
      { error: "Failed to read recent outcomes" },
      { status: 500 }
    );
  }
}
