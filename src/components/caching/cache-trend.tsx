"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type CacheTrendData = {
  date: string;
  cacheRead: number;
  cacheWrite: number;
  input: number;
  output: number;
};

type CacheTrendProps = {
  data: CacheTrendData[];
};

export function CacheTrend({ data }: CacheTrendProps) {
  const trendData = data.map((d) => {
    const total = d.cacheRead + d.cacheWrite + d.input + d.output;
    return {
      date: d.date,
      hitRate: total > 0 ? (d.cacheRead / total) * 100 : 0,
    };
  });

  if (!trendData || trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-zinc-500 text-sm">No trend data yet</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" })}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Hit Rate"]}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
            }}
          />
          <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "80% target", position: "insideBottomRight", fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="hitRate"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
