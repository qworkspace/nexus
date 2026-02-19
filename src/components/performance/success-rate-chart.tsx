"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DailyData {
  date: string;
  successRate: number;
  avgDuration: number;
  taskCount: number;
}

export function SuccessRateChart({ data }: { data: DailyData[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    }),
    successRate: Math.round(d.successRate * 10) / 10,
  }));

  if (formattedData.every((d) => d.taskCount === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No activity data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            color: "#18181b",
            fontSize: "12px",
          }}
          formatter={(value, name) => {
            if (name === "successRate") return [`${value}%`, "Success Rate"];
            return [value, name];
          }}
          labelFormatter={(label) => String(label)}
        />
        <ReferenceLine
          y={95}
          stroke="#A8B5A0"
          strokeDasharray="5 5"
          label={{ value: "95% target", position: "right", fill: "#A8B5A0", fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="successRate"
          stroke="#3f3f46"
          strokeWidth={2}
          dot={{ fill: "#3f3f46", strokeWidth: 0, r: 3 }}
          activeDot={{ fill: "#18181b", strokeWidth: 0, r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
