"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSummaryCards } from "@/components/tokens/token-summary-cards";
import { DailyUsageChart } from "@/components/tokens/daily-usage-chart";
import { ModelBreakdownChart } from "@/components/tokens/model-breakdown-chart";
import { SessionTypeBreakdownChart } from "@/components/tokens/session-type-breakdown-chart";
import { CostByTypeChart } from "@/components/tokens/cost-by-type-chart";
import { TopConsumersList } from "@/components/tokens/top-consumers-list";
import { TokenAlertsPanel } from "@/components/tokens/token-alerts-panel";
import useSWR from "swr";
import type { TokenUsageResponse } from "@/lib/tokens/types";
import { RefreshCw, Activity } from "lucide-react";

async function fetcher(url: string): Promise<TokenUsageResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default function TokenUsagePage() {
  const { data, error, isLoading, mutate } = useSWR<TokenUsageResponse>(
    "/api/tokens",
    fetcher,
    {
      refreshInterval: 300000, // 5-minute refresh
      revalidateOnFocus: false,
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Token Usage
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Track token consumption across all sessions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 dark:border-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading token data...</p>
          </div>
        ) : error || !data ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-2">Error loading token data</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Please try refreshing the page</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alerts */}
            <TokenAlertsPanel alerts={data.alerts} />

            {/* Summary Cards */}
            <TokenSummaryCards
              today={data.today}
              yesterday={data.yesterday}
              thisWeek={data.thisWeek}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Usage Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Daily Token Usage (Last 14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyUsageChart data={data.byDay} />
                </CardContent>
              </Card>

              {/* Model Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Model Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byModel.length > 0 ? (
                    <ModelBreakdownChart data={data.byModel} />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-sm text-zinc-500 dark:text-zinc-400">
                      No model data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Session Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.bySessionType.length > 0 ? (
                    <SessionTypeBreakdownChart data={data.bySessionType} />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-sm text-zinc-500 dark:text-zinc-400">
                      No session type data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown and Top Consumers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Breakdown by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Cost Breakdown by Token Type (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CostByTypeChart data={data.today} />
                </CardContent>
              </Card>

              {/* Top Consumers */}
              <TopConsumersList consumers={data.topConsumers} />
            </div>

            {/* Cache Status Footer */}
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              {data.cached ? (
                <span>Cached at {new Date(data.cacheTime || "").toLocaleTimeString()}</span>
              ) : (
                <span>Fresh data</span>
              )}
              {" • "}
              <span>Auto-refresh: 5 min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
