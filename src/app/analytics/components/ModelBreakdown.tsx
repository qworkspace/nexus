"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ModelUsage {
  model: string;
  tokens: number;
  cost: number;
  percentage: number;
}

interface ModelBreakdownProps {
  data: ModelUsage[];
}

const COLORS = ["#F5D547", "#3D3D3D", "#A8B5A0", "#B8B0C8", "#D4C5A9"];

export function ModelBreakdown({ data }: ModelBreakdownProps) {
  const chartData = data.map((item) => ({
    name: item.model,
    value: item.percentage,
    tokens: item.tokens,
    cost: item.cost,
  }));

  return (
    <div className="flex items-center gap-8">
      {/* Pie Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={(entry) => `${entry.value}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Table */}
      <div className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 font-medium text-zinc-600">Model</th>
              <th className="text-right py-2 font-medium text-zinc-600">Tokens</th>
              <th className="text-right py-2 font-medium text-zinc-600">Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.model} className="border-b border-zinc-100">
                <td className="py-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {item.model}
                </td>
                <td className="text-right py-2 text-zinc-600">
                  {(item.tokens / 1000).toFixed(0)}k
                </td>
                <td className="text-right py-2 text-zinc-900 font-medium">
                  ${item.cost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
