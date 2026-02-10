"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  { key: "new", label: "New", icon: "📥" },
  { key: "in-progress", label: "In Progress", icon: "🔨" },
  { key: "done", label: "Done", icon: "✅" },
  { key: "blocked", label: "Blocked", icon: "❌" },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
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
      <Link href="/company" className="text-sm text-blue-500 hover:underline mb-2 inline-block">← Company HQ</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">📥 Action Items Board</h1>
          <p className="text-zinc-500 text-sm">{items.length} total items</p>
        </div>
        <div className="flex gap-2">
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="px-3 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
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
            <div key={col.key} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {col.icon} {col.label}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {colItems.map(item => {
                  const agent = agentMap[item.assignee] || agentMap[item.assignee.toLowerCase()];
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{agent?.emoji || "❓"}</span>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          @{agent?.name || item.assignee}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[item.priority] || "bg-zinc-400"}`} />
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{item.task}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">
                          {item.source?.meeting} • {item.source?.date}
                        </span>
                        {col.key === "new" && (
                          <button
                            onClick={() => updateStatus(item.id, "in-progress")}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Start →
                          </button>
                        )}
                        {col.key === "in-progress" && (
                          <button
                            onClick={() => updateStatus(item.id, "done")}
                            className="text-xs text-emerald-500 hover:underline"
                          >
                            Done ✓
                          </button>
                        )}
                        {col.key === "blocked" && (
                          <button
                            onClick={() => updateStatus(item.id, "new")}
                            className="text-xs text-amber-500 hover:underline"
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                      {item.outcome && (
                        <p className="text-xs text-emerald-500 mt-1">✅ {item.outcome}</p>
                      )}
                      {item.blockedBy && (
                        <p className="text-xs text-red-500 mt-1">❌ {item.blockedBy}</p>
                      )}
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-4">No items</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
