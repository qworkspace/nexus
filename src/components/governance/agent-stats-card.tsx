"use client";

import { Activity, CheckCircle, XCircle, DollarSign } from "lucide-react";

type Agent = {
  id: string;
  type: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  costPerSuccess: number;
};

type AgentStatsCardProps = {
  agent: Agent;
  onSelect: () => void;
  isSelected: boolean;
};

export function AgentStatsCard({ agent, onSelect, isSelected }: AgentStatsCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-white dark:bg-card rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md
        ${isSelected ? "ring-2 ring-blue-500 border-zinc-500" : "border-zinc-200 dark:border-border"}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-foreground">{agent.id}</h3>
        <span className="text-xs bg-zinc-100 dark:bg-secondary px-2 py-1 rounded text-muted-foreground dark:text-muted-foreground">
          {agent.type}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <Activity size={14} />
            Runs
          </div>
          <span className="font-medium text-zinc-900 dark:text-foreground">{agent.totalRuns}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <CheckCircle size={14} />
            Success
          </div>
          <span className={`font-medium ${
            agent.successRate >= 0.8 ? "text-zinc-900" :
            agent.successRate >= 0.5 ? "text-yellow-600" : "text-zinc-500"
          }`}>
            {(agent.successRate * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <XCircle size={14} />
            Avg Time
          </div>
          <span className="font-medium text-zinc-900 dark:text-foreground">{(agent.avgDuration / 1000).toFixed(1)}s</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <DollarSign size={14} />
            Cost/Success
          </div>
          <span className="font-medium text-zinc-900 dark:text-foreground">${agent.costPerSuccess.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
