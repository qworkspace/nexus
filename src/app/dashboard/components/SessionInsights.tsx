"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, Zap } from "lucide-react";
import useSWR from "swr";

interface SessionInsightsResponse {
  source: 'live' | 'mock' | 'error';
  current?: {
    startedAt: string;
    durationMs: number;
    tokensUsed: number;
    cost: number;
    model: string;
    agent?: string;
  };
  today?: {
    sessions: number;
    totalTokens: number;
    totalCost: number;
    summaries: Array<{
      id: string;
      startedAt: string;
      durationMs: number;
      tokensUsed: number;
      cost: number;
      tasksCompleted: number;
      channel: string;
      agent?: string;
    }>;
  };
  byAgent?: Array<{ agent: string; sessionCount: number; totalTokens: number; totalCost: number }>;
  byModel?: Array<{ model: string; sessionCount: number; totalTokens: number; totalCost: number }>;
  error?: string;
}

async function fetcher(url: string): Promise<SessionInsightsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function SessionInsights() {
  const { data, error, isLoading } = useSWR<SessionInsightsResponse>(
    '/api/session/insights',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const current = data?.current;
  const today = data?.today;
  const byAgent = data?.byAgent;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">SESSION INSIGHTS</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-zinc-500">
            Loading...
          </div>
        ) : error || !data ? (
          <div className="text-center py-4 text-sm text-zinc-500">
            Error loading session data
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Session */}
            {current && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Current Session
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatDuration(Math.floor(current.durationMs / 1000))}
                    </p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatTokens(current.tokensUsed)}
                    </p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-zinc-400" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCost(current.cost)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Summary */}
            {today && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Today&apos;s Summary
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Sessions</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {today.sessions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Tokens</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatTokens(today.totalTokens)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Cost</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCost(today.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* By Agent */}
            {byAgent && byAgent.length > 0 && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  By Agent
                </p>
                <div className="space-y-1.5">
                  {byAgent.slice(0, 3).map((item) => (
                    <div key={item.agent} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">{item.agent}</span>
                      <div className="text-right">
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                          {formatTokens(item.totalTokens)}
                        </span>
                        <span className="text-zinc-500 ml-1">
                          ({item.sessionCount})
                        </span>
                      </div>
                    </div>
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
