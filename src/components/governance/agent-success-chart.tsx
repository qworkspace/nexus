"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Agent = {
  id: string;
  type: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  costPerSuccess: number;
};

type AgentSuccessChartProps = {
  agents: Agent[];
};

export function AgentSuccessChart({ agents }: AgentSuccessChartProps) {
  const data = agents.map((agent) => ({
    agent: agent.id,
    successRate: (agent.successRate * 100).toFixed(1),
  }));

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-zinc-500 text-sm">No agent performance data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="agent"
            tick={{ fontSize: 12 }}
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
            formatter={(value) => [String(value || "") + "%", "Success Rate"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="successRate"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
