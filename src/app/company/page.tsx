"use client";

import { useEffect, useState, useRef } from "react";
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
  isHuman?: boolean;
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
  status: string;
  source: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface CompanyHealth {
  score: number;
  breakdown: { actions: number; meetings: number; trust: number };
}

interface CompanyStatus {
  health: CompanyHealth;
  actions: { open: number; done: number; overdue: number };
  meetings: { total: number; last: string | null };
  trust: { average: number };
  recentActivity: ActivityEntry[];
}

export default function CompanyPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [status, setStatus] = useState<CompanyStatus | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isActivityScrolled, setIsActivityScrolled] = useState(false);
  const activityContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    Promise.all([
      fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || [])),
      fetch("/api/company/actions").then(r => r.json()).then(d => setActions(d.items || [])),
      fetch("/api/company/meetings").then(r => r.json()).then(d => setMeetings(d.meetings || [])),
      fetch("/api/company/status").then(r => r.json()).then(d => setStatus(d)),
      fetch("/api/company/activity").then(r => r.json()).then(d => setActivity(d.feed || [])),
    ]);

    // Poll activity feed every 15s
    const pollActivity = async () => {
      try {
        const res = await fetch("/api/company/activity");
        const data = await res.json();
        const newEntries = data.feed || [];
        const currentEntries = activity;
        const newCount = newEntries.length - currentEntries.length;

        if (newCount > 0 && isActivityScrolled) {
          setNewActivityCount(prev => prev + newCount);
        }

        setActivity(newEntries);
      } catch (err) {
        console.error("Failed to poll activity:", err);
      }
    };

    const activityInterval = setInterval(pollActivity, 15000);

    // Poll status every 30s
    const pollStatus = async () => {
      try {
        const res = await fetch("/api/company/status");
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    };

    const statusInterval = setInterval(pollStatus, 30000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(statusInterval);
    };
  }, [activity, isActivityScrolled]);

  const openActions = actions.filter(a => a.status !== "done");
  const doneActions = actions.filter(a => a.status === "done");
  const localAgents = agents.filter(a => !a.isHuman && a.id !== "ella" && a.id !== "arty");

  // Calculate sparkline data for each agent (last 7 days of task completions)
  const agentSparklines: Record<string, number[]> = {};

  localAgents.forEach(agent => {
    // Generate random but consistent sparkline data based on agent ID
    // In production, this would come from action items history
    const seed = agent.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const data: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayValue = ((seed * (i + 1)) % 5) + Math.floor(Math.random() * 3);
      data.push(dayValue);
    }
    agentSparklines[agent.id] = data;
  });

  // Check if activity feed is scrolled
  const handleActivityScroll = () => {
    const container = activityContainerRef.current;
    if (container) {
      const { scrollTop } = container;
      const isScrolled = scrollTop > 20;
      setIsActivityScrolled(isScrolled);
    }
  };

  const resetActivityScroll = () => {
    if (activityContainerRef.current) {
      activityContainerRef.current.scrollTop = 0;
      setNewActivityCount(0);
      setIsActivityScrolled(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🏢 Company HQ</h1>
          <p className="text-zinc-500 text-sm">Villanueva Creative — {agents.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Link href="/company/floor" className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">🎮 The Floor</Link>
          <Link href="/company/org" className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">🗂️ Org Chart</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Health + Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Score */}
          {status && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Company Health</h2>
                <HealthBadge score={status.health.score} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Health Score" value={`${status.health.score}`} suffix="/100" color={status.health.score >= 70 ? "emerald" : status.health.score >= 40 ? "amber" : "red"} />
                <StatCard label="Open Actions" value={`${status.actions.open}`} sub={status.actions.overdue > 0 ? `${status.actions.overdue} overdue` : "none overdue"} color={status.actions.overdue > 0 ? "red" : "emerald"} />
                <StatCard label="Meetings" value={`${status.meetings.total}`} sub={status.meetings.last ? `Last: ${status.meetings.last}` : "None yet"} color="blue" />
                <StatCard label="Avg Trust" value={`${status.trust.average}`} suffix="/100" color={status.trust.average >= 60 ? "emerald" : "amber"} />
              </div>

              {/* Health breakdown bar */}
              <div className="mt-4 space-y-2">
                <HealthBar label="Action Items" value={status.health.breakdown.actions} />
                <HealthBar label="Meeting Cadence" value={status.health.breakdown.meetings} />
                <HealthBar label="Team Trust" value={status.health.breakdown.trust} />
              </div>
            </div>
          )}

          {/* Agent Grid */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {localAgents.map(agent => {
                const sparkline = agentSparklines[agent.id] || [];
                const trendingUp = sparkline.length >= 2 && sparkline[sparkline.length - 1] > sparkline[sparkline.length - 2];
                return (
                  <Link key={agent.id} href={`/company/agents/${agent.id}`} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-center group">
                    <span className="text-2xl">{agent.emoji}</span>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">{agent.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{agent.role}</p>
                    <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{agent.model.primary.split("/").pop()}</p>
                    {/* Sparkline */}
                    {sparkline.length > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <Sparkline data={sparkline} color={trendingUp ? "emerald" : "red"} />
                        <span className={`text-[9px] font-bold ${trendingUp ? "text-emerald-500" : "text-red-500"}`}>
                          {trendingUp ? "↑" : "↓"}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Recent Meetings */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">📋 Recent Meetings</h3>
                <Link href="/company/meetings" className="text-[10px] text-blue-500 hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {meetings.slice(0, 5).map(m => (
                  <Link key={m.id} href={`/company/meetings?selected=${m.id}`} className="flex items-center justify-between p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{m.title}</span>
                    <span className="text-[10px] text-zinc-400 ml-2 shrink-0">{m.date}</span>
                  </Link>
                ))}
                {meetings.length === 0 && <p className="text-zinc-500 text-xs py-4 text-center">No meetings yet — first standup at 10am</p>}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">📥 Action Items</h3>
                <Link href="/company/actions" className="text-[10px] text-blue-500 hover:underline">View board →</Link>
              </div>
              <div className="space-y-2">
                {openActions.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <StatusDot status={a.status} />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">{a.task}</span>
                    <span className="text-[10px] text-zinc-400">{a.assignee}</span>
                  </div>
                ))}
                {openActions.length === 0 && <p className="text-zinc-500 text-xs py-4 text-center">No open action items 🎉</p>}
              </div>
              <div className="mt-2 text-[10px] text-zinc-400 text-center">
                {doneActions.length} completed • {openActions.length} open
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">⚡ Activity Feed</h3>
              {newActivityCount > 0 && (
                <button
                  onClick={resetActivityScroll}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-full transition-colors"
                >
                  {newActivityCount} new
                </button>
              )}
            </div>
            <div
              ref={activityContainerRef}
              onScroll={handleActivityScroll}
              className="space-y-3 max-h-[500px] overflow-y-auto"
            >
              {(status?.recentActivity || activity).slice(0, 20).map((entry, i) => (
                <div key={entry.id || i} className="flex gap-2 text-xs">
                  <span>{entry.emoji}</span>
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{entry.agentName}</span>
                    <span className="text-zinc-500 ml-1">{entry.message}</span>
                    {entry.timestamp && (
                      <p className="text-[9px] text-zinc-400 mt-0.5">{formatRelativeTime(entry.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}
              {activity.length === 0 && !status?.recentActivity?.length && (
                <p className="text-zinc-500 text-xs text-center py-8">Activity will appear here as agents work</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Quick Links</h3>
            <Link href="/company/floor" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">🎮 The Floor — Watch agents work</Link>
            <Link href="/company/org" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">🗂️ Org Chart — Company structure</Link>
            <Link href="/company/relationships" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">🤝 Relationships — Trust matrix</Link>
            <Link href="/company/meetings" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">📋 Meetings — Transcripts & history</Link>
            <Link href="/company/actions" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">📥 Actions — Task board</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? "emerald" : score >= 40 ? "amber" : "red";
  const colors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const labels: Record<string, string> = { emerald: "Healthy", amber: "Needs Attention", red: "Critical" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[color]}`}>
      {labels[color]} — {score}/100
    </span>
  );
}

function StatCard({ label, value, suffix, sub, color }: { label: string; value: string; suffix?: string; sub?: string; color: string }) {
  const textColors: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-center">
      <p className={`text-2xl font-bold ${textColors[color] || "text-zinc-900 dark:text-zinc-100"}`}>
        {value}<span className="text-sm font-normal text-zinc-400">{suffix}</span>
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-zinc-500 w-28 text-right shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-zinc-400 w-8">{value}</span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    todo: "bg-zinc-400",
    "in-progress": "bg-blue-500",
    blocked: "bg-red-500",
    done: "bg-emerald-500",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status] || "bg-zinc-400"}`} />;
}

function Sparkline({ data, color }: { data: number[]; color: "emerald" | "red" | "amber" | "blue" }) {
  const colorClass = color === "emerald" ? "stroke-emerald-500" : color === "red" ? "stroke-red-500" : "stroke-zinc-500";
  const max = Math.max(...data, 1);
  const width = 60;
  const height = 16;
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value / max) * (height - 2)) - 1;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        className={colorClass}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] / max) * (height - 2)) - 1}
          r="2"
          className={colorClass}
          fill="currentColor"
        />
      )}
    </svg>
  );
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
