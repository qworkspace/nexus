"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetchOpenClawSessions,
  OpenClawSessionsResponse,
  OpenClawStatusResponse,
} from "@/lib/openclaw-client";

export interface CostBreakdown {
  byModel: Record<string, number> & {
    opus: number;
    sonnet: number;
    glm: number;
    other: number;
  };
  byAgent: Record<string, number> & {
    Q: number;
    Dev: number;
    others: number;
  };
}

interface CostData {
  today: number;
  budget: number;
  budgetPercent: number;
  projection: number;
  withinBudget: boolean;
  breakdown: CostBreakdown;
  totalTokens: number;
}

// Fallback mock data
const MOCK_COSTS: CostData = {
  today: 12.47,
  budget: 24.00,
  budgetPercent: 52,
  projection: 18.70,
  withinBudget: true,
  breakdown: {
    byModel: {
      opus: 11.20,
      sonnet: 1.27,
      glm: 0.00,
      other: 0.00,
    },
    byAgent: {
      Q: 10.50,
      Dev: 0.00,
      others: 1.97,
    },
  },
  totalTokens: 45000,
};

// Pricing per 1M tokens (in USD)
const PRICING: Record<string, { input: number; output: number }> = {
  opus: { input: 15.00, output: 75.00 },
  sonnet: { input: 3.00, output: 15.00 },
  glm: { input: 0.50, output: 2.00 },
  other: { input: 1.00, output: 5.00 },
};

export function useCosts() {
  const [costs, setCosts] = useState<CostData>(MOCK_COSTS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [useMock, setUseMock] = useState(false);

  // Fetch OpenClaw status
  const { data: statusData } = useSWR<OpenClawStatusResponse>(
    '/api/openclaw/status',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  // Fetch sessions data
  const { data: sessionsData } = useSWR<OpenClawSessionsResponse>(
    statusData?.online && !useMock ? '/api/openclaw/sessions' : null,
    fetchOpenClawSessions,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
      onError: (err) => {
        console.error('Error fetching costs data:', err);
        if (process.env.NODE_ENV === 'development') {
          setUseMock(true);
        }
      },
    }
  );

  // Calculate costs from sessions
  useEffect(() => {
    if (useMock || !sessionsData) {
      setCosts(MOCK_COSTS);
      return;
    }

    // Calculate costs from sessions
    const sessions = sessionsData.sessions || [];
    let totalCost = 0;
    let totalTokens = 0;

    const breakdown: CostBreakdown = {
      byModel: { opus: 0, sonnet: 0, glm: 0, other: 0 },
      byAgent: { Q: 0, Dev: 0, others: 0 },
    };

    sessions.forEach((session) => {
      const inputTokens = session.inputTokens || 0;
      const outputTokens = session.outputTokens || 0;
      const totalSessionTokens = session.totalTokens || 0;
      
      totalTokens += totalSessionTokens;

      // Estimate input/output split if not provided
      const estInput = inputTokens || Math.floor(totalSessionTokens * 0.3);
      const estOutput = outputTokens || Math.floor(totalSessionTokens * 0.7);

      // Determine model pricing
      let model = 'other';
      if (session.model.includes('opus')) {
        model = 'opus';
      } else if (session.model.includes('sonnet')) {
        model = 'sonnet';
      } else if (session.model.includes('glm')) {
        model = 'glm';
      }

      const pricing = PRICING[model];
      const cost = (estInput / 1000000) * pricing.input + (estOutput / 1000000) * pricing.output;
      totalCost += cost;

      // Update model breakdown
      breakdown.byModel[model] += cost;

      // Update agent breakdown
      const key = session.key || '';
      if (key.includes(':main:') || key.includes('agent:main')) {
        breakdown.byAgent.Q += cost;
      } else if (key.includes('spawn')) {
        breakdown.byAgent.Dev += cost;
      } else {
        breakdown.byAgent.others += cost;
      }
    });

    // Calculate projection based on time of day
    const now = new Date();
    const hoursPassed = now.getHours() + now.getMinutes() / 60;
    const hoursRemaining = Math.max(0, 24 - hoursPassed);
    const ratePerHour = hoursPassed > 0 ? totalCost / hoursPassed : 0;
    const projection = totalCost + ratePerHour * hoursRemaining;

    // Round to 2 decimal places
    const round2 = (n: number) => Math.round(n * 100) / 100;

    setCosts({
      today: round2(totalCost),
      budget: 24.00,
      budgetPercent: Math.round((totalCost / 24.00) * 100),
      projection: round2(projection),
      withinBudget: projection <= 24.00,
      breakdown: {
        byModel: {
          opus: round2(breakdown.byModel.opus),
          sonnet: round2(breakdown.byModel.sonnet),
          glm: round2(breakdown.byModel.glm),
          other: round2(breakdown.byModel.other),
        },
        byAgent: {
          Q: round2(breakdown.byAgent.Q),
          Dev: round2(breakdown.byAgent.Dev),
          others: round2(breakdown.byAgent.others),
        },
      },
      totalTokens,
    });

    setLastUpdated(new Date());
  }, [sessionsData, useMock]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getProgressColor = (percent: number): string => {
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return {
    costs,
    lastUpdated,
    formatCurrency,
    getProgressColor,
    source: useMock ? 'mock' : 'live',
    gatewayOnline: statusData?.online ?? false,
  };
}

// Helper fetcher function
async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
