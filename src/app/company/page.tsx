"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  department: string;
  reportsTo: string;
  directReports: string[];
  personality: string;
  model: { primary: string; fallback: string | null };
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  agentName: string;
  emoji: string;
  message: string;
}

interface ActionItem {
  id: string;
  assignee: string;
  task: string;
  priority: string;
  status: string;
}

interface Meeting {
  id: string;
  date: string;
  type: string;
  title: string;
}

interface CompanyInfo {
  name: string;
  mission: string;
  values: string[];
  culture: string;
}

export default function CompanyHQ() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetch("/api/company/roster").then(r => r.json()).then(d => {
      setAgents(d.agents || []);
      if (d.company) setCompany(d.company);
    });
    fetch("/api/company/activity?limit=20").then(r => r.json()).then(d => setActivity(d.entries || []));
    fetch("/api/company/actions").then(r => r.json()).then(d => setActions(d.items || []));
    fetch("/api/company/meetings").then(r => r.json()).then(d => setMeetings(d.meetings || []));
  }, []);

  const openActions = actions.filter(a => ["new", "in-progress", "blocked"].includes(a.status));
  const doneActions = actions.filter(a => a.status === "done");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">🏢 {company?.name || "Agent Company"} HQ</h1>
        {company?.mission && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 italic">&quot;{company.mission}&quot;</p>
        )}
        <p className="text-zinc-500 mt-1">{agents.length} agents • {openActions.length} open items • {meetings.length} meetings logged</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Org Chart</h2>
          <OrgChart agents={agents} />
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Activity Feed</h2>
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activity.length === 0 && <p className="text-zinc-500 text-sm">No activity yet. Run your first standup!</p>}
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="text-lg mt-0.5">{entry.emoji}</span>
                <div>
                  <p className="text-zinc-700 dark:text-zinc-300">{entry.message}</p>
                  <p className="text-xs text-zinc-400">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Status Grid */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Agent Status</h2>
          <div className="grid grid-cols-3 gap-3">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/company/agents/${agent.id}`}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{agent.emoji}</span>
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{agent.name}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{agent.role}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Meetings & Actions Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Stats</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{openActions.length}</p>
              <p className="text-xs text-zinc-500">Open Action Items</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{doneActions.length}</p>
              <p className="text-xs text-zinc-500">Completed Items</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{meetings.length}</p>
              <p className="text-xs text-zinc-500">Meetings Logged</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{agents.length}</p>
              <p className="text-xs text-zinc-500">Active Agents</p>
            </div>
          </div>

          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Recent Meetings</h3>
          <div className="space-y-2">
            {meetings.slice(0, 5).map((m) => (
              <Link
                key={m.id}
                href={`/company/meetings?selected=${m.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
              >
                <span className="text-zinc-700 dark:text-zinc-300">{m.title}</span>
                <span className="text-xs text-zinc-400">{m.date}</span>
              </Link>
            ))}
            {meetings.length === 0 && <p className="text-zinc-500 text-sm">No meetings yet</p>}
          </div>

          <div className="mt-4 flex gap-2">
            <Link href="/company/actions" className="text-xs text-blue-500 hover:underline">View Action Board →</Link>
            <Link href="/company/meetings" className="text-xs text-blue-500 hover:underline">View Meetings →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgChart({ agents }: { agents: Agent[] }) {
  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
  const pj = { id: "pj", name: "PJ", emoji: "👤", role: "CEO" };
  const ellaAgent = agentMap["ella"];
  const ella = ellaAgent || { id: "ella", name: "Ella", emoji: "👩‍🎨", role: "CEO" };

  if (agents.length === 0) return <p className="text-zinc-500 text-sm">Loading...</p>;

  const q = agentMap["main"];
  const arty = agentMap["arty"];
  const directReports = agents.filter(a => a.reportsTo === "main" && a.id !== "main");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dual CEOs */}
      <div className="flex items-center gap-6">
        <OrgNode name={pj.name} emoji={pj.emoji} role={pj.role} />
        <span className="text-zinc-300 dark:text-zinc-700 text-lg">+</span>
        <OrgNode name={ella.name} emoji={ella.emoji} role={ella.role} href={ellaAgent ? `/company/agents/ella` : undefined} />
      </div>
      <div className="flex items-center gap-16">
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
      </div>

      {/* Dual COOs */}
      <div className="flex items-center gap-6">
        {q && <OrgNode name={q.name} emoji={q.emoji} role="COO (PJ)" href={`/company/agents/${q.id}`} />}
        {arty && <OrgNode name={arty.name} emoji={arty.emoji} role="COO (Ella)" href={`/company/agents/${arty.id}`} />}
      </div>
      <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />

      {/* Q's direct reports */}
      <div className="flex flex-wrap justify-center gap-3">
        {directReports.map((agent) => (
          <div key={agent.id} className="flex flex-col items-center gap-2">
            <OrgNode name={agent.name} emoji={agent.emoji} role={agent.role} href={`/company/agents/${agent.id}`} small />
            {agents.filter(a => a.reportsTo === agent.id).map((sub) => (
              <div key={sub.id} className="flex flex-col items-center">
                <div className="w-px h-2 bg-zinc-300 dark:bg-zinc-700" />
                <OrgNode name={sub.name} emoji={sub.emoji} role={sub.role} href={`/company/agents/${sub.id}`} small />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgNode({ name, emoji, role, href, small }: { name: string; emoji: string; role: string; href?: string; small?: boolean }) {
  const content = (
    <div className={`flex flex-col items-center p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 ${href ? "hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer" : ""} ${small ? "min-w-[70px]" : "min-w-[100px]"}`}>
      <span className={small ? "text-lg" : "text-2xl"}>{emoji}</span>
      <span className={`font-medium text-zinc-900 dark:text-zinc-100 ${small ? "text-xs" : "text-sm"}`}>{name}</span>
      <span className={`text-zinc-500 ${small ? "text-[10px]" : "text-xs"} text-center`}>{role}</span>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
