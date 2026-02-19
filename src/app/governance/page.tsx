"use client";

import { useState, useEffect } from "react";
import { Shield, Activity, AlertTriangle } from "lucide-react";
import { PermissionMatrix } from "@/components/governance/permission-matrix";
import { AuditLog } from "@/components/governance/audit-log";
import { AgentStatsCard } from "@/components/governance/agent-stats-card";
import { AgentSuccessChart } from "@/components/governance/agent-success-chart";

type GovernanceData = {
  agents: Array<{
    id: string;
    type: string;
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    costPerSuccess: number;
  }>;
  permissions: Record<string, Record<string, boolean>>;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    agentId: string;
    tool: string;
    action: string;
    result: string;
    durationMs?: number;
  }>;
  summary: {
    totalAgents: number;
    totalRunsToday: number;
    avgSuccessRate: number;
    totalCostToday: number;
  };
};

export default function GovernancePage() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/governance");
      if (!response.ok) throw new Error("Failed to fetch governance data");
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Governance</h1>
          <p className="text-muted-foreground text-sm">Enterprise agent oversight and control</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-100 dark:bg-secondary rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Governance</h1>
          <p className="text-muted-foreground text-sm">Enterprise agent oversight and control</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-700 dark:text-zinc-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            Failed to load governance data: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.agents.length === 0) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Governance</h1>
          <p className="text-muted-foreground text-sm">Enterprise agent oversight and control</p>
        </div>
        <div className="bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-border rounded-xl p-12 text-center">
          <Shield size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-foreground mb-2">No governance data available</h3>
          <p className="text-muted-foreground">Agent activity will appear here once actions are logged.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Governance</h1>
        <p className="text-muted-foreground text-sm">Enterprise agent oversight and control</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Active Agents</p>
          <div className="flex items-center gap-2 mt-2">
            <Shield size={16} className="text-muted-foreground" />
            <span className="text-3xl font-bold text-zinc-900 dark:text-foreground">
              {data.summary.totalAgents}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Runs Today</p>
          <div className="flex items-center gap-2 mt-2">
            <Activity size={16} className="text-muted-foreground" />
            <span className="text-3xl font-bold text-zinc-900 dark:text-foreground">
              {data.summary.totalRunsToday}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Avg Success Rate</p>
          <span className="text-3xl font-bold text-zinc-900 dark:text-foreground mt-2 inline-block">
            {(data.summary.avgSuccessRate * 100).toFixed(1)}%
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Cost Today</p>
          <span className="text-3xl font-bold text-zinc-900 dark:text-foreground mt-2 inline-block">
            ${data.summary.totalCostToday.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Agent Performance Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {data.agents.map((agent) => (
          <AgentStatsCard
            key={agent.id}
            agent={agent}
            onSelect={() => setSelectedAgent(agent.id)}
            isSelected={selectedAgent === agent.id}
          />
        ))}
      </div>

      {/* Success Rate Chart */}
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4 mb-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground mb-4">Agent Success Rates (7 Days)</h3>
        <AgentSuccessChart agents={data.agents} />
      </div>

      {/* Two-column grid for Permissions and Audit Log */}
      <div className="grid grid-cols-2 gap-4">
        <PermissionMatrix
          permissions={data.permissions}
          onPermissionChange={async (agentId, tool, granted) => {
            await fetch("/api/governance/permissions", {
              method: "PUT",
              body: JSON.stringify({ agentId, tool, granted }),
              headers: { "Content-Type": "application/json" },
            });
            fetchData();
          }}
        />

        <AuditLog
          logs={data.auditLogs}
          selectedAgent={selectedAgent}
          onAgentFilter={setSelectedAgent}
        />
      </div>
    </div>
  );
}
