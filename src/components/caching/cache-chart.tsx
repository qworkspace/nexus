"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type CacheChartData = {
  date: string;
  cacheRead: number;
  cacheWrite: number;
  input: number;
  output: number;
};

type CacheChartProps = {
  data: CacheChartData[];
};

export function CacheChart({ data }: CacheChartProps) {
  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">No cache data for this period</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" })}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatTokens}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [formatTokens(Number(value || 0)), "Tokens"]}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="cacheRead" stackId="tokens" fill="#A8B5A0" name="Cache Read" opacity={0.8} />
          <Bar dataKey="cacheWrite" stackId="tokens" fill="#B8B0C8" name="Cache Write" opacity={0.8} />
          <Bar dataKey="input" stackId="tokens" fill="#3D3D3D" name="Input" opacity={0.8} />
          <Bar dataKey="output" stackId="tokens" fill="#F5D547" name="Output" opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
