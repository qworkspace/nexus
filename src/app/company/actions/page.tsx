"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Hammer, CheckCircle, XCircle, HelpCircle, Check } from "lucide-react";
import { AgentIcon } from "@/lib/agent-icons";

interface ActionItem {
  id: string;
  assignee: string;
  task: string;
  priority: string;
  status: string;
  source: { meeting: string; date: string };
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  outcome: string | null;
  blockedBy: string | null;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

const COLUMNS = [
  { key: "new", label: "New", icon: Inbox },
  { key: "in-progress", label: "In Progress", icon: Hammer },
  { key: "done", label: "Done", icon: CheckCircle },
  { key: "blocked", label: "Blocked", icon: XCircle },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-zinc-500",
  medium: "bg-[#F5D547]",
  low: "bg-[#F5D547]",
};

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentFilter, setAgentFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/company/actions").then(r => r.json()).then(d => setItems(d.items || []));
    fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || []));
  }, []);

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
  // Also map by name (lowercase) for meeting-generated items
  for (const a of agents) {
    agentMap[a.name.toLowerCase()] = a;
  }

  const filtered = agentFilter === "all" ? items : items.filter(i => i.assignee === agentFilter || agentMap[i.assignee]?.id === agentFilter);

  const updateStatus = async (itemId: string, status: string) => {
    await fetch(`/api/company/actions/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh
    const d = await fetch("/api/company/actions").then(r => r.json());
    setItems(d.items || []);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/company" className="text-sm text-foreground hover:underline mb-2 inline-block">← The Core</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-foreground flex items-center gap-2">
            <Inbox size={24} />
            Action Items Board
          </h1>
          <p className="text-muted-foreground text-sm">{items.length} total items</p>
        </div>
        <div className="flex gap-2">
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="px-3 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-secondary text-zinc-700 dark:text-foreground border border-zinc-200 dark:border-border"
          >
            <option value="all">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colItems = filtered.filter(i => i.status === col.key);
          return (
            <div key={col.key} className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-foreground flex items-center gap-1.5">
                  <col.icon size={16} />
                  {col.label}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-secondary text-muted-foreground">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {colItems.map(item => {
                  const agent = agentMap[item.assignee] || agentMap[item.assignee.toLowerCase()];
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-zinc-200 dark:border-border bg-zinc-50 dark:bg-secondary/50">
                      <div className="flex items-center gap-2 mb-2">
                        {agent?.emoji ? (
                          <AgentIcon emoji={agent.emoji} size={14} />
                        ) : (
                          <HelpCircle size={14} className="text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium text-zinc-700 dark:text-foreground">
                          @{agent?.name || item.assignee}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[item.priority] || "bg-zinc-400"}`} />
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-foreground mb-2">{item.task}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {item.source?.meeting} • {item.source?.date}
                        </span>
                        {col.key === "new" && (
                          <button
                            onClick={() => updateStatus(item.id, "in-progress")}
                            className="text-xs text-foreground hover:underline"
                          >
                            Start →
                          </button>
                        )}
                        {col.key === "in-progress" && (
                          <button
                            onClick={() => updateStatus(item.id, "done")}
                            className="text-xs text-foreground hover:underline flex items-center gap-1"
                          >
                            Done
                            <Check size={12} />
                          </button>
                        )}
                        {col.key === "blocked" && (
                          <button
                            onClick={() => updateStatus(item.id, "new")}
                            className="text-xs text-[#F5D547] hover:underline"
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                      {item.outcome && (
                        <p className="text-xs text-foreground mt-1 flex items-center gap-1">
                          <CheckCircle size={12} />
                          {item.outcome}
                        </p>
                      )}
                      {item.blockedBy && (
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <XCircle size={12} />
                          {item.blockedBy}
                        </p>
                      )}
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No items</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
