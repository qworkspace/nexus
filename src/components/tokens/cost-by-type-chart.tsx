"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TokenPeriodSummary } from "@/lib/tokens/types";

interface CostByTypeChartProps {
  data: TokenPeriodSummary;
}

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

const COST_TYPES = [
  { key: "inputCost" as const, label: "Input", color: "#3D3D3D" },
  { key: "outputCost" as const, label: "Output", color: "#F5D547" },
  { key: "cacheReadCost" as const, label: "Cache Read", color: "#A8B5A0" },
  { key: "cacheWriteCost" as const, label: "Cache Write", color: "#B8B0C8" },
] as const;

export function CostByTypeChart({ data }: CostByTypeChartProps) {
  const chartData = COST_TYPES.map((type) => ({
    label: type.label,
    cost: data[type.key] || 0,
    color: type.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
          tickFormatter={(value) => formatCost(value)}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            color: "#18181b",
            fontSize: "12px",
          }}
          formatter={(value) => formatCost(typeof value === 'number' ? value : 0)}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <rect key={`bar-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
