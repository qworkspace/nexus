"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenSummaryCards } from "@/components/tokens/token-summary-cards";
import { DailyUsageChart } from "@/components/tokens/daily-usage-chart";
import { ModelBreakdownChart } from "@/components/tokens/model-breakdown-chart";
import { SessionTypeBreakdownChart } from "@/components/tokens/session-type-breakdown-chart";
import { CostByTypeChart } from "@/components/tokens/cost-by-type-chart";
import { TopConsumersList } from "@/components/tokens/top-consumers-list";
import { TokenAlertsPanel } from "@/components/tokens/token-alerts-panel";
import { CostBreakdown } from "@/components/costs/cost-breakdown";
import { ExpensiveActivities } from "@/components/costs/expensive-activities";
import useSWR from "swr";
import type { TokenUsageResponse } from "@/lib/tokens/types";
import { RefreshCw } from "lucide-react";
import { db } from "@/lib/db";

async function fetcher(url: string): Promise<TokenUsageResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default function UsageAndCostsPage() {
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Usage & Costs
          </h1>
          <p className="text-zinc-500 text-sm">
            Track token consumption and spending across all sessions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading usage data...</p>
          </div>
        ) : error || !data ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-2">Error loading usage data</p>
            <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
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

            {/* Daily Chart - Shows both tokens and cost */}
            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Daily Usage & Cost (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyUsageChart data={data.byDay} />
              </CardContent>
            </Card>

            {/* Model and Session Type Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-zinc-900">
                    Model Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byModel.length > 0 ? (
                    <ModelBreakdownChart data={data.byModel} />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                      No model data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-zinc-900">
                    Session Type Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.bySessionType.length > 0 ? (
                    <SessionTypeBreakdownChart data={data.bySessionType} />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                      No session type data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown and Top Consumers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Breakdown by Type */}
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-zinc-900">
                    Cost Breakdown by Token Type (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CostByTypeChart data={data.today} />
                </CardContent>
              </Card>

              {/* Top Consumers */}
              <TopConsumersList consumers={data.topConsumers} />
            </div>

            {/* Cost Breakdown by Model and Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-zinc-900">
                    Cost by Model (This Month)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CostBreakdown
                    title=""
                    icon=""
                    items={data.byModel.map((m) => ({
                      label: m.model,
                      cost: m.totalCost,
                      count: m.requestCount,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-zinc-900">
                    Cost by Session Type (This Month)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CostBreakdown
                    title=""
                    icon=""
                    items={data.bySessionType.map((s) => ({
                      label: s.type,
                      cost: s.totalCost,
                      count: s.requestCount,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Most Expensive Activities */}
            <ExpensiveActivitiesWrapper />

            {/* Cache Status Footer */}
            <div className="text-center text-xs text-muted-foreground">
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

// Client wrapper for server-side fetched expensive activities
function ExpensiveActivitiesWrapper() {
  const { data } = useSWR("/api/costs/top-expensive", async () => {
    const topExpensive = await db.activity.findMany({
      where: { cost: { not: null } },
      orderBy: { cost: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        cost: true,
        tokensIn: true,
        tokensOut: true,
        model: true,
        timestamp: true,
      },
    });
    return topExpensive;
  }, { revalidateOnFocus: false });

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-zinc-900">
          Most Expensive Activities (All Time)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ExpensiveActivities activities={data} />
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No cost data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
