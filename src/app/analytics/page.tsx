"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewCards } from "./components/OverviewCards";
import { UsageChart } from "./components/UsageChart";
import { ModelBreakdown } from "./components/ModelBreakdown";
import { AgentPerformance } from "./components/AgentPerformance";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { TimePeriodSelector } from "./components/TimePeriodSelector";
import { Bot, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data, isLoading } = useSWR(
    `/api/analytics/overview?period=${period}`,
    fetcher,
    { refreshInterval: 120000 }
  );

  const overviewData = {
    messages: data?.overview?.messages || 0,
    messagesChange: 12,
    cost: data?.overview?.cost || 0,
    costChange: -8,
    sessions: data?.overview?.sessions || 0,
    sessionsChange: 23,
    successRate: data?.overview?.successRate || 0,
  };

  const usageData = data?.dailyData || [];
  const modelUsage = data?.modelUsage || [];
  const agentPerformance = data?.agentPerformance || [];
  const heatmapData = data?.heatmapData || [];
  const dataSource = data?.source || 'mock';

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
          <p className="text-zinc-500 text-sm">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
          <p className="text-zinc-500 text-sm">
            Performance metrics and usage insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimePeriodSelector value={period} onChange={setPeriod} />
          {dataSource === 'error' && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Using cached data
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8">
        <OverviewCards data={overviewData} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Usage Over Time Chart */}
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp size={18} />
                Usage Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageChart data={usageData} />
            </CardContent>
          </Card>
        </div>

        {/* Model Breakdown */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bot size={18} />
                Model Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModelBreakdown data={modelUsage} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Agent Performance */}
        <div className="col-span-12 lg:col-span-7">
          <AgentPerformance data={agentPerformance} />
        </div>

        {/* Activity Heatmap */}
        <div className="col-span-12 lg:col-span-5">
          <ActivityHeatmap data={heatmapData} />
        </div>
      </div>
    </div>
  );
}
