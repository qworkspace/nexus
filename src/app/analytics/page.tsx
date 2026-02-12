"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewCards } from "./components/OverviewCards";
import { UsageChart } from "./components/UsageChart";
import { ModelBreakdown } from "./components/ModelBreakdown";
import { AgentPerformance } from "./components/AgentPerformance";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { TimePeriodSelector } from "./components/TimePeriodSelector";
import { Bot, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  // Mock data
  const overviewData = {
    messages: 1234,
    messagesChange: 12,
    cost: 47.50,
    costChange: -8,
    sessions: 156,
    sessionsChange: 23,
    successRate: 89,
  };

  const usageData = [
    { date: "2026-02-01", messages: 120, cost: 5.20 },
    { date: "2026-02-02", messages: 156, cost: 7.80 },
    { date: "2026-02-03", messages: 98, cost: 4.50 },
    { date: "2026-02-04", messages: 210, cost: 9.20 },
    { date: "2026-02-05", messages: 187, cost: 8.10 },
    { date: "2026-02-06", messages: 145, cost: 6.30 },
    { date: "2026-02-07", messages: 318, cost: 13.40 },
  ];

  const modelUsage = [
    { model: "Opus", tokens: 450000, cost: 42.30, percentage: 58 },
    { model: "Sonnet", tokens: 89000, cost: 3.20, percentage: 12 },
    { model: "GLM Flash", tokens: 234000, cost: 0, percentage: 30 },
  ];

  const agentPerformance = [
    { name: "Q", icon: "Bot", tasks: 89, avgTime: "4.2m", successRate: 94, costPerTask: 0.48 },
    { name: "Dev", icon: "Monitor", tasks: 34, avgTime: "8.7m", successRate: 91, costPerTask: 0.00 },
    { name: "Creative", icon: "Palette", tasks: 5, avgTime: "12.3m", successRate: 100, costPerTask: 0.34 },
    { name: "Research", icon: "Search", tasks: 8, avgTime: "6.1m", successRate: 88, costPerTask: 0.29 },
    { name: "Testing", icon: "FlaskConical", tasks: 2, avgTime: "15.0m", successRate: 100, costPerTask: 0.00 },
  ];

  const heatmapData = [
    { day: "Mon", hours: [2, 0, 0, 45, 78, 82, 65, 12] },
    { day: "Tue", hours: [3, 0, 1, 52, 71, 85, 34, 8] },
    { day: "Wed", hours: [1, 0, 0, 48, 56, 79, 72, 15] },
    { day: "Thu", hours: [4, 0, 0, 62, 88, 74, 81, 28] },
    { day: "Fri", hours: [5, 0, 0, 39, 67, 83, 92, 45] },
    { day: "Sat", hours: [0, 0, 0, 8, 32, 45, 12, 2] },
    { day: "Sun", hours: [0, 0, 0, 3, 18, 28, 5, 0] },
  ];

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
        <TimePeriodSelector />
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
