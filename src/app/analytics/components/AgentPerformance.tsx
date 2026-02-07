"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentData {
  name: string;
  icon: string;
  tasks: number;
  avgTime: string;
  successRate: number;
  costPerTask: number;
}

interface AgentPerformanceProps {
  data: AgentData[];
}

export function AgentPerformance({ data }: AgentPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>🦾</span>
          Agent Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-3 font-medium text-zinc-600">Agent</th>
              <th className="text-right py-3 font-medium text-zinc-600">Tasks</th>
              <th className="text-right py-3 font-medium text-zinc-600">Avg Time</th>
              <th className="text-right py-3 font-medium text-zinc-600">Success</th>
              <th className="text-right py-3 font-medium text-zinc-600">Cost/Task</th>
            </tr>
          </thead>
          <tbody>
            {data.map((agent) => (
              <tr key={agent.name} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span>{agent.icon}</span>
                    <span className="font-medium text-zinc-900">{agent.name}</span>
                  </div>
                </td>
                <td className="text-right py-3 text-zinc-600">{agent.tasks}</td>
                <td className="text-right py-3 text-zinc-600">{agent.avgTime}</td>
                <td className="text-right py-3">
                  <span
                    className={`font-medium ${
                      agent.successRate >= 90
                        ? "text-emerald-600"
                        : agent.successRate >= 80
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {agent.successRate}%
                  </span>
                </td>
                <td className="text-right py-3 text-zinc-900">
                  ${agent.costPerTask.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
