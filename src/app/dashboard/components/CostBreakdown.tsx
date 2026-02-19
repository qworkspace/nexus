"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

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

interface CostBreakdownResponse {
  data?: CostSummary;
  error?: string;
}

async function fetcher(url: string): Promise<CostBreakdownResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const getServiceColor = (service: string): string => {
  switch (service) {
    case "anthropic":
      return "bg-zinc-500";
    case "openai":
      return "bg-zinc-500";
    case "local":
      return "bg-zinc-500";
    default:
      return "bg-zinc-500";
  }
};

const getServiceLabel = (service: string): string => {
  switch (service) {
    case "anthropic":
      return "Anthropic (Claude)";
    case "openai":
      return "OpenAI (GPT)";
    case "local":
      return "Local Models";
    default:
      return service;
  }
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
    return tokens.toString();
};

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

interface CostBarProps {
  label: string;
  value: number;
  total: number;
  colorClass: string;
  subtitle?: string;
}

function CostBar({ label, value, total, colorClass, subtitle }: CostBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <div className="text-right">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            ${value.toFixed(2)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 ml-1">
            ({formatPercentage(value, total)})
          </span>
        </div>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {subtitle && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">{subtitle}</p>
      )}
    </div>
  );
}

export function CostBreakdown() {
  const { data, error, isLoading } = useSWR<CostBreakdownResponse>(
    '/api/costs/summary?period=day',
    fetcher,
    {
      refreshInterval: 60000, // 1-minute refresh
      revalidateOnFocus: false,
    }
  );

  const summary = data?.data;
  const byService = summary?.byService || [];
  const byModel = summary?.byModel || [];
  const total = summary?.total || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">COST BREAKDOWN</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Loading cost data...
          </div>
        ) : error || !summary ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error loading cost breakdown
          </div>
        ) : total === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            No costs recorded today
          </div>
        ) : (
          <div className="space-y-6">
            {/* By Service */}
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                By Service (Today)
              </p>
              <div className="space-y-3">
                {byService.length > 0 ? (
                  byService.map((item) => (
                    <CostBar
                      key={item.service}
                      label={getServiceLabel(item.service)}
                      value={item.cost}
                      total={total}
                      colorClass={getServiceColor(item.service)}
                      subtitle={`${item.count} API calls`}
                    />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No service data</p>
                )}
              </div>
            </div>

            {/* By Model */}
            {byModel.length > 0 && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                  By Model (Top 5)
                </p>
                <div className="space-y-3">
                  {byModel.slice(0, 5).map((item) => (
                    <CostBar
                      key={item.model}
                      label={item.model}
                      value={item.cost}
                      total={total}
                      colorClass="bg-zinc-500"
                      subtitle={`${formatTokens(item.inputTokens + item.outputTokens)} tokens • ${item.count} requests`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
