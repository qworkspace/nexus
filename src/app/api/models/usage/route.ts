import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aggregateUsageFromTranscripts } from '@/lib/data-utils';
import { fetchCostData } from '@/lib/cost-data-service';

interface ModelUsage {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  requests: number;
}

interface ModelsUsageResponse {
  source: 'live' | 'mock' | 'error';
  currentModel: string;
  usage: ModelUsage[];
  totalCost: number;
  recommendations: { message: string; model: string; reason: string }[];
  cliCost?: {
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  error?: string;
}

export async function GET(): Promise<NextResponse<ModelsUsageResponse>> {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const now = new Date();

    // Fetch CLI cost data for accurate totals
    let cliCostTotal = 0;
    let cliCostData: { totalCost: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number } | undefined;

    try {
      const cliData = await fetchCostData();
      const todayStr = now.toISOString().split('T')[0];
      const todayCliData = cliData.daily.find(d => d.date === todayStr);

      if (todayCliData) {
        cliCostData = {
          totalCost: todayCliData.totalCost,
          inputTokens: todayCliData.input,
          outputTokens: todayCliData.output,
          cacheReadTokens: todayCliData.cacheRead,
          cacheWriteTokens: todayCliData.cacheWrite,
        };
        cliCostTotal = todayCliData.totalCost;
      }
    } catch (cliError) {
      console.warn('Failed to fetch CLI cost data, using transcript/database costs:', cliError);
    }

    // Try to get real usage from session transcripts
    let usage: ModelUsage[] = [];
    let totalCost = 0;
    let source: 'live' | 'mock' | 'error' = 'live';

    try {
      // Aggregate usage from transcripts for today
      const transcriptUsage = await aggregateUsageFromTranscripts(todayStart, now);

      // Group by model
      const modelMap = new Map<string, ModelUsage>();

      for (const u of transcriptUsage) {
        const existing = modelMap.get(u.model) || {
          model: u.model,
          tokensIn: 0,
          tokensOut: 0,
          cost: 0,
          requests: 0,
        };

        existing.tokensIn += u.inputTokens;
        existing.tokensOut += u.outputTokens;
        existing.cost += u.cost;
        existing.requests += 1;

        modelMap.set(u.model, existing);
      }

      usage = Array.from(modelMap.values());

      // If we have CLI data, prefer those totals for accuracy
      totalCost = cliCostTotal > 0 ? cliCostTotal : usage.reduce((sum, u) => sum + u.cost, 0);

      // If no data from transcripts, fall back to database
      if (usage.length === 0) {
        const activities = await db.activity.findMany({
          where: {
            timestamp: { gte: todayStart },
            model: { not: null },
          },
          select: {
            model: true,
            tokensIn: true,
            tokensOut: true,
            cost: true,
          },
        });

        const dbModelMap = new Map<string, ModelUsage>();

        for (const activity of activities) {
          if (!activity.model) continue;

          const existing = dbModelMap.get(activity.model) || {
            model: activity.model,
            tokensIn: 0,
            tokensOut: 0,
            cost: 0,
            requests: 0,
          };

          existing.tokensIn += activity.tokensIn || 0;
          existing.tokensOut += activity.tokensOut || 0;
          existing.cost += activity.cost || 0;
          existing.requests += 1;

          dbModelMap.set(activity.model, existing);
        }

        usage = Array.from(dbModelMap.values());
        totalCost = cliCostTotal > 0 ? cliCostTotal : usage.reduce((sum, u) => sum + u.cost, 0);

        if (usage.length > 0) {
          source = 'live'; // Database data
        } else {
          source = 'mock'; // No data anywhere
        }
      }
    } catch (transcriptError) {
      console.error('Failed to aggregate from transcripts, falling back to database:', transcriptError);

      // Fall back to database
      try {
        const activities = await db.activity.findMany({
          where: {
            timestamp: { gte: todayStart },
            model: { not: null },
          },
          select: {
            model: true,
            tokensIn: true,
            tokensOut: true,
            cost: true,
          },
        });

        const dbModelMap = new Map<string, ModelUsage>();

        for (const activity of activities) {
          if (!activity.model) continue;

          const existing = dbModelMap.get(activity.model) || {
            model: activity.model,
            tokensIn: 0,
            tokensOut: 0,
            cost: 0,
            requests: 0,
          };

          existing.tokensIn += activity.tokensIn || 0;
          existing.tokensOut += activity.tokensOut || 0;
          existing.cost += activity.cost || 0;
          existing.requests += 1;

          dbModelMap.set(activity.model, existing);
        }

        usage = Array.from(dbModelMap.values());
        totalCost = cliCostTotal > 0 ? cliCostTotal : usage.reduce((sum, u) => sum + u.cost, 0);

        if (usage.length > 0) {
          source = 'live';
        } else {
          source = 'mock';
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        source = 'error';
        usage = getMockUsage();
        totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(usage);

    // Current model (default to Opus if unknown)
    const currentModel = 'claude-opus-4-6';

    return NextResponse.json({
      source,
      currentModel,
      usage: usage.length > 0 ? usage : getMockUsage(),
      totalCost,
      recommendations,
      cliCost: cliCostData,
    });
  } catch (error) {
    console.error('Failed to get model usage:', error);
    return NextResponse.json({
      source: 'error',
      currentModel: 'unknown',
      usage: [],
      totalCost: 0,
      recommendations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getMockUsage(): ModelUsage[] {
  return [
    {
      model: 'claude-opus-4-6',
      tokensIn: 125000,
      tokensOut: 45000,
      cost: 5.25,
      requests: 42,
    },
    {
      model: 'claude-sonnet-4-5',
      tokensIn: 280000,
      tokensOut: 95000,
      cost: 2.27,
      requests: 128,
    },
    {
      model: 'glm-4.7-flash',
      tokensIn: 450000,
      tokensOut: 180000,
      cost: 0,
      requests: 256,
    },
  ];
}

function generateRecommendations(usage: ModelUsage[]): { message: string; model: string; reason: string }[] {
  const recommendations: { message: string; model: string; reason: string }[] = [];

  // Check if Opus usage is high
  const opusUsage = usage.find(u => u.model.includes('opus'));
  if (opusUsage && opusUsage.cost > 5) {
    recommendations.push({
      message: 'Consider switching to Sonnet for routine tasks',
      model: 'claude-sonnet-4-5',
      reason: `Opus cost today: $${opusUsage.cost.toFixed(2)}. Sonnet is 5x cheaper for similar quality on most tasks.`,
    });
  }

  // Check if local model could help
  const totalTokens = usage.reduce((sum, u) => sum + u.tokensIn + u.tokensOut, 0);
  if (totalTokens > 500000) {
    recommendations.push({
      message: 'High token usage - consider local model for simple tasks',
      model: 'glm-4.7-flash',
      reason: 'Local GLM is free and handles simple code edits well.',
    });
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      message: 'Current model selection is optimal',
      model: '',
      reason: 'Token usage is balanced across models.',
    });
  }

  return recommendations;
}
