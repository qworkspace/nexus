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

interface DailyData {
  date: string;
  cost: number;
}

export function CostChart({ data }: { data: DailyData[] }) {
  // Format date labels
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    }),
    cost: Math.round(d.cost * 100) / 100,
  }));

  if (formattedData.every((d) => d.cost === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        No cost data yet
      </div>
    );
  }

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
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
          }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
          labelFormatter={(label) => String(label)}
        />
        <Bar 
          dataKey="cost" 
          fill="#3f3f46" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
