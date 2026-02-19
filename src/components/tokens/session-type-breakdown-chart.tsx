"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { SessionTypeBreakdown } from "@/lib/tokens/types";

interface SessionTypeBreakdownChartProps {
  data: SessionTypeBreakdown[];
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

const SESSION_TYPE_COLORS: Record<string, string> = {
  main: "#F5D547", // yellow
  cron: "#3D3D3D", // charcoal
  subagent: "#A8B5A0", // sage
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  main: "Main",
  cron: "Cron",
  subagent: "Subagent",
};

export function SessionTypeBreakdownChart({ data }: SessionTypeBreakdownChartProps) {
  const totalTokens = data.reduce((sum, d) => sum + d.totalTokens, 0);

  const chartData = data.map((d) => ({
    ...d,
    fill: SESSION_TYPE_COLORS[d.type] || "#8E99A4",
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
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            color: "#18181b",
            fontSize: "12px",
          }}
          formatter={(value) => formatTokens(typeof value === 'number' ? value : 0)}
          labelFormatter={(label) => SESSION_TYPE_LABELS[label as string] || label}
        />
        <Legend
          verticalAlign="bottom"
          height={40}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
