import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

interface DailyCost {
  date: string;
  total: number;
  byService: Record<string, number>;
  byModel: Record<string, number>;
  tokensIn: number;
  tokensOut: number;
  activityCount: number;
}

interface CostHistory {
  daily: DailyCost[];
  summary: {
    total: number;
    avgDaily: number;
    highestDay: { date: string; cost: number } | null;
    totalTokensIn: number;
    totalTokensOut: number;
  };
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

// Model pricing per 1M tokens (USD) - same as summary route
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4": { input: 3, output: 15 },
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku": { input: 0.25, output: 1.25 },
  "claude-3-5-haiku-20241022": { input: 0.25, output: 1.25 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3-sonnet": { input: 3, output: 15 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "glm-4-flash": { input: 0, output: 0 },
  "glm-4.7": { input: 0, output: 0 },
  "llama": { input: 0, output: 0 },
  "local": { input: 0, output: 0 },
};

function getServiceFromModel(model: string): string {
  if (model?.startsWith("claude")) return "anthropic";
  if (model?.startsWith("gpt")) return "openai";
  if (model?.startsWith("glm") || model?.startsWith("llama")) return "local";
  return "other";
}

function calculateCost(model: string | null, inputTokens: number = 0, outputTokens: number = 0): number {
  if (!model) return 0;
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["local"];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch activities in the date range
    const activities = await db.activity.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        cost: true,
      },
      orderBy: { timestamp: "desc" },
    });

    // Aggregate by day
    const dailyMap = new Map<string, {
      total: number;
      byService: Record<string, number>;
      byModel: Record<string, number>;
      tokensIn: number;
      tokensOut: number;
      activityCount: number;
    }>();

    for (const activity of activities) {
      const dateStr = new Date(activity.timestamp).toISOString().split("T")[0];
      const existing = dailyMap.get(dateStr) || {
        total: 0,
        byService: {},
        byModel: {},
        tokensIn: 0,
        tokensOut: 0,
        activityCount: 0,
      };

      // Use stored cost or estimate from tokens
      const estimatedCost = activity.cost !== null
        ? activity.cost
        : calculateCost(activity.model ?? null, activity.tokensIn ?? 0, activity.tokensOut ?? 0);

      existing.total += estimatedCost;
      existing.tokensIn += activity.tokensIn || 0;
      existing.tokensOut += activity.tokensOut || 0;
      existing.activityCount += 1;

      // Group by service
      if (activity.model) {
        const service = getServiceFromModel(activity.model);
        existing.byService[service] = (existing.byService[service] || 0) + estimatedCost;
        existing.byModel[activity.model] = (existing.byModel[activity.model] || 0) + estimatedCost;
      }

      dailyMap.set(dateStr, existing);
    }

    // Convert map to array and sort by date
    const dailyArray = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        total: Math.round(data.total * 100) / 100,
        byService: data.byService,
        byModel: data.byModel,
        tokensIn: data.tokensIn,
        tokensOut: data.tokensOut,
        activityCount: data.activityCount,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Apply pagination
    const totalDays = dailyArray.length;
    const paginatedDaily = dailyArray.slice(offset, offset + limit);

    // Calculate summary statistics
    let totalCost = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let highestDay: { date: string; cost: number } | null = null;

    for (const day of dailyArray) {
      totalCost += day.total;
      totalTokensIn += day.tokensIn;
      totalTokensOut += day.tokensOut;

      if (!highestDay || day.total > highestDay.cost) {
        highestDay = { date: day.date, cost: day.total };
      }
    }

    const avgDaily = dailyArray.length > 0 ? totalCost / dailyArray.length : 0;

    const history: CostHistory = {
      daily: paginatedDaily,
      summary: {
        total: Math.round(totalCost * 100) / 100,
        avgDaily: Math.round(avgDaily * 100) / 100,
        highestDay,
        totalTokensIn,
        totalTokensOut,
      },
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < totalDays,
      },
    };

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching cost history:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost history" },
      { status: 500 }
    );
  }
}
