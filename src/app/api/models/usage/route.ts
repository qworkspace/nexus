import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  error?: string;
}

// Model pricing (per 1M tokens) - for future cost calculations
// const MODEL_PRICING: Record<string, { input: number; output: number }> = {
//   'claude-opus-4-5': { input: 15, output: 75 },
//   'claude-sonnet-4': { input: 3, output: 15 },
//   'claude-3-5-sonnet': { input: 3, output: 15 },
//   'claude-3-5-haiku': { input: 0.25, output: 1.25 },
//   'glm-4-flash': { input: 0, output: 0 }, // Free local
//   'gpt-4o': { input: 2.5, output: 10 },
//   'gpt-4o-mini': { input: 0.15, output: 0.6 },
// };

export async function GET(): Promise<NextResponse<ModelsUsageResponse>> {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Try to get real usage from database
    let usage: ModelUsage[] = [];
    let totalCost = 0;

    try {
      // Group activities by model for today
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

      // Aggregate by model
      const modelMap = new Map<string, ModelUsage>();
      
      for (const activity of activities) {
        if (!activity.model) continue;
        
        const existing = modelMap.get(activity.model) || {
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

        modelMap.set(activity.model, existing);
      }

      usage = Array.from(modelMap.values());
      totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
    } catch {
      // Database query failed, use mock data
      usage = getMockUsage();
      totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
    }

    // Generate recommendations
    const recommendations = generateRecommendations(usage);

    // Current model (would need OpenClaw integration)
    const currentModel = 'claude-opus-4-5';

    return NextResponse.json({
      source: usage.length > 0 ? 'live' : 'mock',
      currentModel,
      usage: usage.length > 0 ? usage : getMockUsage(),
      totalCost,
      recommendations,
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
      model: 'claude-opus-4-5',
      tokensIn: 125000,
      tokensOut: 45000,
      cost: 5.25,
      requests: 42,
    },
    {
      model: 'claude-sonnet-4',
      tokensIn: 280000,
      tokensOut: 95000,
      cost: 2.27,
      requests: 128,
    },
    {
      model: 'glm-4-flash',
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
      model: 'claude-sonnet-4',
      reason: `Opus cost today: $${opusUsage.cost.toFixed(2)}. Sonnet is 5x cheaper for similar quality on most tasks.`,
    });
  }

  // Check if local model could help
  const totalTokens = usage.reduce((sum, u) => sum + u.tokensIn + u.tokensOut, 0);
  if (totalTokens > 500000) {
    recommendations.push({
      message: 'High token usage - consider local model for simple tasks',
      model: 'glm-4-flash',
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
