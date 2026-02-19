"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyTokenUsage } from "@/lib/tokens/types";

interface DailyUsageChartProps {
  data: DailyTokenUsage[];
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
};

export function DailyUsageChart({ data }: DailyUsageChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatTokens(typeof value === 'number' ? value : 0)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            color: "#18181b",
            fontSize: "12px",
          }}
          formatter={(value) => formatTokens(typeof value === 'number' ? value : 0)}
          labelFormatter={(label) => String(label)}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#71717a" }}
        />
        <Bar dataKey="input" stackId="1" fill="#3D3D3D" radius={[4, 4, 0, 0]} name="Input" maxBarSize={40} />
        <Bar dataKey="output" stackId="1" fill="#F5D547" radius={[4, 4, 0, 0]} name="Output" maxBarSize={40} />
        <Bar dataKey="cacheRead" stackId="1" fill="#A8B5A0" radius={[4, 4, 0, 0]} name="Cache Read" maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
