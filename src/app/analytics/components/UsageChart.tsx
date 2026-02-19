/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UsageData {
  date: string;
  messages: number;
  cost: number;
}

interface UsageChartProps {
  data: UsageData[];
}

export function UsageChart({ data }: UsageChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={formattedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
        />
        <YAxis
          yAxisId="messages"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="cost"
          orientation="right"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            color: "#18181b",
            fontSize: "12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number | undefined, name: string | undefined) => {
            const numValue = value ?? 0;
            if (!name) return [numValue, ""];
            if (name === "messages") {
              return [numValue.toLocaleString(), "Messages"];
            }
            if (name === "cost") {
              return [`$${numValue.toFixed(2)}`, "Cost"];
            }
            return [numValue, name];
          }) as (value: number | undefined, name: string | undefined) => [string, string]}
        />
        <Legend />
        <Line
          yAxisId="messages"
          type="monotone"
          dataKey="messages"
          stroke="#F5D547"
          strokeWidth={2}
          dot={{ fill: "#F5D547", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Messages"
        />
        <Line
          yAxisId="cost"
          type="monotone"
          dataKey="cost"
          stroke="#A8B5A0"
          strokeWidth={2}
          dot={{ fill: "#A8B5A0", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Cost ($)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
