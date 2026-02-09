import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface SummaryRequest {
  period?: "day" | "week" | "month";
}

interface CostByService {
  service: string;
  cost: number;
  count: number;
}

interface CostByModel {
  model: string;
  cost: number;
  count: number;
  inputTokens: number;
  outputTokens: number;
}

interface CostSummary {
  period: string;
  total: number;
  byService: CostByService[];
  byModel: CostByModel[];
  trend: number;
  previousPeriodTotal: number;
}

// Model pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude models
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4": { input: 3, output: 15 },
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku": { input: 0.25, output: 1.25 },
  "claude-3-5-haiku-20241022": { input: 0.25, output: 1.25 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3-sonnet": { input: 3, output: 15 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },

  // OpenAI models
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },

  // Local/Free models
  "glm-4-flash": { input: 0, output: 0 },
  "glm-4.7": { input: 0, output: 0 },
  "llama": { input: 0, output: 0 },
  "local": { input: 0, output: 0 },
};

// Helper to infer service from model
function getServiceFromModel(model: string): string {
  if (model?.startsWith("claude")) return "anthropic";
  if (model?.startsWith("gpt")) return "openai";
  if (model?.startsWith("glm") || model?.startsWith("llama")) return "local";
  return "other";
}

// Calculate cost from tokens if not already stored
function calculateCost(model: string | null, inputTokens: number = 0, outputTokens: number = 0): number {
  if (!model) return 0;

  const pricing = MODEL_PRICING[model] || MODEL_PRICING["local"];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

// Get date range based on period
function getDateRange(period: string): { start: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  let start: Date;
  let previousStart: Date;

  switch (period) {
    case "day":
      start = new Date(now.setHours(0, 0, 0, 0));
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = new Date(start.setHours(0, 0, 0, 0));
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      break;
  }

  return {
    start,
    previousStart,
    previousEnd: start,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as SummaryRequest["period"]) || "day";

    const { start, previousStart, previousEnd } = getDateRange(period);

    // Get current period data
    const activities = await db.activity.findMany({
      where: {
        timestamp: { gte: start },
      },
      select: {
        id: true,
        type: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        cost: true,
      },
    });

    // Get previous period data for trend calculation
    const previousActivities = await db.activity.findMany({
      where: {
        timestamp: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      select: {
        cost: true,
      },
    });

    // Calculate totals with fallback to estimated cost
    let totalCost = 0;
    const serviceMap = new Map<string, { cost: number; count: number }>();
    const modelMap = new Map<string, { cost: number; count: number; inputTokens: number; outputTokens: number }>();

    for (const activity of activities) {
      // Use stored cost or estimate from tokens
      const estimatedCost = activity.cost !== null
        ? activity.cost
        : calculateCost(activity.model ?? null, activity.tokensIn ?? 0, activity.tokensOut ?? 0);

      totalCost += estimatedCost;

      // Group by service
      if (activity.model) {
        const service = getServiceFromModel(activity.model);
        const existing = serviceMap.get(service) || { cost: 0, count: 0 };
        existing.cost += estimatedCost;
        existing.count += 1;
        serviceMap.set(service, existing);
      }

      // Group by model
      if (activity.model) {
        const existing = modelMap.get(activity.model) || {
          cost: 0,
          count: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
        existing.cost += estimatedCost;
        existing.count += 1;
        existing.inputTokens += activity.tokensIn || 0;
        existing.outputTokens += activity.tokensOut || 0;
        modelMap.set(activity.model, existing);
      }
    }

    // Calculate previous period total
    let previousTotal = 0;
    for (const activity of previousActivities) {
      previousTotal += activity.cost || 0;
    }

    // Calculate trend percentage
    let trend = 0;
    if (previousTotal > 0) {
      trend = ((totalCost - previousTotal) / previousTotal) * 100;
    }

    // Format response
    const byService = Array.from(serviceMap.entries())
      .map(([service, data]) => ({
        service,
        cost: data.cost,
        count: data.count,
      }))
      .sort((a, b) => b.cost - a.cost);

    const byModel = Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        cost: data.cost,
        count: data.count,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
      }))
      .sort((a, b) => b.cost - a.cost);

    const summary: CostSummary = {
      period,
      total: Math.round(totalCost * 100) / 100,
      byService,
      byModel,
      trend: Math.round(trend * 10) / 10,
      previousPeriodTotal: Math.round(previousTotal * 100) / 100,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching cost summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost summary" },
      { status: 500 }
    );
  }
}
