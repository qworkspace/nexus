"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ModelBreakdown } from "@/lib/tokens/types";

interface ModelBreakdownChartProps {
  data: ModelBreakdown[];
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};

const getModelColor = (provider: string, index: number): string => {
  switch (provider) {
    case "anthropic":
      return "#8b5cf6"; // purple
    case "zai":
      return "#3b82f6"; // blue
    case "openai":
      return "#10b981"; // green
    default:
      // Fallback colors for different models
      const fallbackColors = ["#f59e0b", "#ef4444", "#ec4899", "#6366f1"];
      return fallbackColors[index % fallbackColors.length];
  }
};

export function ModelBreakdownChart({ data }: ModelBreakdownChartProps) {
  const totalTokens = data.reduce((sum, d) => sum + d.totalTokens, 0);

  const chartData = data.map((d, index) => ({
    ...d,
    fill: getModelColor(d.provider, index),
    percentage: totalTokens > 0 ? ((d.totalTokens / totalTokens) * 100).toFixed(1) : "0",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="totalTokens"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
          }}
          formatter={(value) => formatTokens(typeof value === 'number' ? value : 0)}
          labelFormatter={(label) => String(label)}
        />
        <Legend
          verticalAlign="bottom"
          height={40}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
