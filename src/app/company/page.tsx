"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AgentIcon } from "@/lib/agent-icons";
import {
  LayoutGrid, GitBranch, Calendar, Inbox,
  Activity, LinkIcon, TrendingUp, TrendingDown, AlertTriangle,
  Repeat, BookOpen, Zap, HeartPulse
} from "lucide-react";
import ScorecardPanel from "@/components/ScorecardPanel";
import { MetricTooltip } from "@/components/ui/tooltip";

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

interface LoopStatus {
  scorecard: Record<string, number> | null;
  regressions: Array<{ severity: string; pattern: string; count: number }>;
  skills: {
    total: number;
    proficiency_avg: number;
    by_category: Record<string, number>;
    recent: Array<{ name: string; acquired: string; proficiency: number }>;
  };
  buildStats: { success: number; failed: number; total: number; rate: number };
  lessonsThisWeek: number;
  updated_at: string;
}

export default function CompanyPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [status, setStatus] = useState<CompanyStatus | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isActivityScrolled, setIsActivityScrolled] = useState(false);
  const [loopStatus, setLoopStatus] = useState<LoopStatus | null>(null);
  const [qModelDisplay, setQModelDisplay] = useState<string>("Claude Opus 4.6");
  const activityContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    Promise.all([
      fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || [])),
      fetch("/api/company/actions").then(r => r.json()).then(d => setActions(d.items || [])),
      fetch("/api/company/meetings").then(r => r.json()).then(d => setMeetings(d.meetings || [])),
      fetch("/api/company/status").then(r => r.json()).then(d => setStatus(d)),
      fetch("/api/company/activity").then(r => r.json()).then(d => setActivity(d.feed || [])),
      fetch("/api/loops/status").then(r => r.json()).then(d => setLoopStatus(d)).catch(() => {}),
      fetch("/api/company/q-model").then(r => r.json()).then(d => setQModelDisplay(d.modelDisplay || "Claude Opus 4.6")).catch(() => {}),
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

    // Poll loop status every 5 minutes
    const pollLoopStatus = async () => {
      try {
        const res = await fetch("/api/loops/status");
        const data = await res.json();
        setLoopStatus(data);
      } catch (err) {
        console.error("Failed to poll loop status:", err);
      }
    };

    const loopInterval = setInterval(pollLoopStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(statusInterval);
      clearInterval(loopInterval);
    };
  }, [activity, isActivityScrolled]);

  const openActions = actions.filter(a => a.status !== "done");
  const doneActions = actions.filter(a => a.status === "done");
  const localAgents = agents.filter(a => !a.isHuman && a.id !== "ella" && a.id !== "arty");

  // Agent colour mapping for visual distinction
  const agentColours: Record<string, { border: string; glow: string }> = {
    q: { border: "border-l-amber-500", glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]" },
    aura: { border: "border-l-pink-400", glow: "shadow-[0_0_20px_-5px_rgba(244,114,182,0.15)]" },
    surge: { border: "border-l-green-500", glow: "shadow-[0_0_20px_-5px_rgba(34,197,94,0.15)]" },
    spark: { border: "border-l-blue-500", glow: "shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]" },
    cipher: { border: "border-l-purple-500", glow: "shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)]" },
    volt: { border: "border-l-red-500", glow: "shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]" },
    echo: { border: "border-l-teal-500", glow: "shadow-[0_0_20px_-5px_rgba(20,184,166,0.15)]" },
    flux: { border: "border-l-orange-500", glow: "shadow-[0_0_20px_-5px_rgba(249,115,22,0.15)]" },
    prism: { border: "border-l-transparent bg-gradient-to-b from-red-500 via-green-500 to-blue-500", glow: "shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]" },
    luna: { border: "border-l-slate-400", glow: "shadow-[0_0_20px_-5px_rgba(148,163,184,0.15)]" },
  };

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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <HeartPulse size={24} className="text-foreground" />
            The Core
          </h1>
          <p className="text-zinc-500 text-sm">Villanueva Creative — {agents.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Link href="/company/floor" className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-1.5">
            <LayoutGrid size={14} />
            The Floor
          </Link>
          <Link href="/company/org" className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-1.5">
            <GitBranch size={14} />
            Org Chart
          </Link>
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
                <MetricTooltip content="Overall system health — combines agent uptime, build success rate, error rate, and resource utilization. Calculated from OpenClaw gateway metrics.">
                  <TooltipStatCard label="Health Score" value={`${status.health.score}`} suffix="/100" color={status.health.score >= 70 ? "emerald" : status.health.score >= 40 ? "amber" : "red"} />
                </MetricTooltip>
                <MetricTooltip content="Actions assigned to agents that haven't been completed yet. Overdue means action age > 24 hours.">
                  <TooltipStatCard label="Open Actions" value={`${status.actions.open}`} sub={status.actions.overdue > 0 ? `${status.actions.overdue} overdue` : "none overdue"} color={status.actions.overdue > 0 ? "red" : "emerald"} />
                </MetricTooltip>
                <MetricTooltip content="Upcoming agent standups and meetings. Tracks scheduled time slots from cron jobs.">
                  <TooltipStatCard label="Meetings" value={`${status.meetings.total}`} sub={status.meetings.last ? `Last: ${status.meetings.last}` : "None yet"} color="blue" />
                </MetricTooltip>
                <MetricTooltip content="Average trust score between agents. Trust increases when agents successfully hand off work and deliver quality. Decreases on failures and escalations.">
                  <TooltipStatCard label="Avg Trust" value={`${status.trust.average}`} suffix="/100" color={status.trust.average >= 60 ? "emerald" : "amber"} />
                </MetricTooltip>
              </div>

              {/* Health breakdown bar */}
              <div className="mt-4 space-y-2">
                <MetricTooltip content="Ratio of completed vs. pending action items. 100 = all items done, 0 = nothing started.">
                  <TooltipHealthBar label="Action Items" value={status.health.breakdown.actions} />
                </MetricTooltip>
                <MetricTooltip content="How frequently agents meet for standups. Higher scores indicate better meeting cadence (daily/weekly).">
                  <TooltipHealthBar label="Meeting Cadence" value={status.health.breakdown.meetings} />
                </MetricTooltip>
                <MetricTooltip content="Aggregate trust score across all agent pairs. Differs from Avg Trust (card) which includes self-trust metrics.">
                  <TooltipHealthBar label="Team Trust" value={status.health.breakdown.trust} />
                </MetricTooltip>
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
                const colours = agentColours[agent.id.toLowerCase()] || { border: "border-l-zinc-300", glow: "" };
                // Use qModelDisplay for Q agent, otherwise use roster data
                const modelDisplay = agent.name === "Q" ? qModelDisplay : agent.model.primary.split("/").pop();
                return (
                  <Link
                    key={agent.id}
                    href={`/company/agents/${agent.id}`}
                    className={`p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-center group border-l-4 ${colours.border} ${colours.glow}`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <AgentIcon emoji={agent.emoji} size={28} className="text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">{agent.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{agent.role}</p>
                    <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{modelDisplay}</p>
                    {/* Sparkline */}
                    {sparkline.length > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <Sparkline data={sparkline} color={trendingUp ? "emerald" : "red"} />
                        {trendingUp ? (
                          <TrendingUp size={10} className="text-foreground" />
                        ) : (
                          <TrendingDown size={10} className="text-red-500" />
                        )}
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
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Calendar size={14} />
                  Recent Meetings
                </h3>
                <Link href="/company/meetings" className="text-[10px] text-zinc-500 hover:text-foreground hover:underline">View all →</Link>
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
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Inbox size={14} />
                  Action Items
                </h3>
                <Link href="/company/actions" className="text-[10px] text-zinc-500 hover:text-foreground hover:underline">View board →</Link>
              </div>
              <div className="space-y-2">
                {openActions.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <StatusDot status={a.status} />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">{a.task}</span>
                    <span className="text-[10px] text-zinc-400">{a.assignee}</span>
                  </div>
                ))}
                {openActions.length === 0 && <p className="text-zinc-500 text-xs py-4 text-center">No open action items</p>}
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
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Activity size={14} />
                Activity Feed
              </h3>
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
                  <AgentIcon emoji={entry.emoji} size={16} className="text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5" />
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
            <Link href="/company/floor" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <LayoutGrid size={14} className="shrink-0" />
              The Floor — Watch agents work
            </Link>
            <Link href="/company/org" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <GitBranch size={14} className="shrink-0" />
              Org Chart — Company structure
            </Link>
            <Link href="/company/relationships" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <LinkIcon size={14} className="shrink-0" />
              Relationships — Trust matrix
            </Link>
            <Link href="/company/meetings" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <Calendar size={14} className="shrink-0" />
              Meetings — Transcripts & history
            </Link>
            <Link href="/company/actions" className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <Inbox size={14} className="shrink-0" />
              Actions — Task board
            </Link>
          </div>

          {/* Loop 0 Scorecard Panel */}
          <ScorecardPanel />

          {/* Loop Status Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-1.5">
              <Repeat size={14} />
              Loop Status
            </h3>

            {loopStatus ? (
              <div className="space-y-4">
                {/* Growth Metrics */}
                <div className="space-y-2">
                  <MetricTooltip content="Number of lessons learned and documented this week. Tracks Q's self-improvement loop effectiveness.">
                    <TooltipLoopMetricBar
                      icon={<BookOpen size={12} />}
                      label="Learning"
                      value={loopStatus.lessonsThisWeek}
                      max={10}
                      unit="lessons/wk"
                      color="blue"
                    />
                  </MetricTooltip>
                  <MetricTooltip content="Percentage of successful builds. Higher is better. Tracks build reliability and code quality.">
                    <TooltipLoopMetricBar
                      icon={<Zap size={12} />}
                      label="Build Rate"
                      value={loopStatus.buildStats.rate}
                      max={100}
                      unit="%"
                      color={loopStatus.buildStats.rate >= 70 ? "emerald" : loopStatus.buildStats.rate >= 40 ? "amber" : "red"}
                    />
                  </MetricTooltip>
                  <MetricTooltip content="Total number of skills acquired. Goal is 50 skills. Tracks Q's capability expansion.">
                    <TooltipLoopMetricBar
                      icon={<Activity size={12} />}
                      label="Skills"
                      value={loopStatus.skills.total}
                      max={50}
                      unit="/50 target"
                      color="purple"
                    />
                  </MetricTooltip>
                </div>

                {/* Skill Proficiency */}
                {loopStatus.skills.total > 0 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-500">Avg Proficiency</span>
                      <span className="text-zinc-400">{loopStatus.skills.proficiency_avg.toFixed(1)}/5</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= Math.round(loopStatus.skills.proficiency_avg)
                              ? "bg-zinc-800"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Categories */}
                {Object.keys(loopStatus.skills.by_category).length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 mb-2">Skills by Category</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(loopStatus.skills.by_category).map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between text-[10px] px-1.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800">
                          <span className="text-zinc-500 capitalize">{cat}</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regression Alerts */}
                {loopStatus.regressions && loopStatus.regressions.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-2">
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Regressions Detected
                      </p>
                      <div className="space-y-1">
                        {loopStatus.regressions.slice(0, 3).map((reg, i) => (
                          <div key={i} className="text-[10px] flex items-start gap-1">
                            <span className={reg.severity === "high" ? "text-red-500" : "text-[#8a7000]"}>
                              {reg.severity === "high" ? "🔴" : "🟡"}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400 truncate flex-1">
                              {reg.pattern.slice(0, 40)}...
                            </span>
                            <span className="text-zinc-400 shrink-0">×{reg.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Core Scorecard (if available) */}
                {loopStatus.scorecard && Object.keys(loopStatus.scorecard).length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 mb-2">Weekly Scorecard</p>
                    <div className="grid grid-cols-5 gap-1">
                      {["autonomy", "quality", "speed", "alignment", "energy"].map(metric => (
                        <div key={metric} className="text-center">
                          <div className="text-sm font-bold text-foreground">
                            {loopStatus.scorecard?.[metric] || 0}
                          </div>
                          <div className="text-[8px] text-zinc-400 uppercase">
                            {metric.slice(0, 3)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-4">Loading loop status...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? "emerald" : score >= 40 ? "amber" : "red";
  const colors: Record<string, string> = {
    emerald: "bg-zinc-100 text-zinc-800",
    amber: "bg-[#FFE135]/40 text-[#7a6200]",
    red: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = { emerald: "Healthy", amber: "Needs Attention", red: "Critical" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[color]}`}>
      {labels[color]} — {score}/100
    </span>
  );
}

function TooltipStatCard({ label, value, suffix, sub, color }: { label: string; value: string; suffix?: string; sub?: string; color: string }) {
  const textColors: Record<string, string> = {
    emerald: "text-zinc-800",
    amber: "text-[#7a6200]",
    red: "text-red-600",
    blue: "text-zinc-700",
  };
  return (
    <div className="p-3 rounded-lg bg-zinc-50 text-center cursor-help">
      <p className={`text-2xl font-bold ${textColors[color] || "text-zinc-900 dark:text-zinc-100"}`}>
        {value}<span className="text-sm font-normal text-zinc-400">{suffix}</span>
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function TooltipHealthBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-zinc-900" : value >= 40 ? "bg-[#FFE135]" : "bg-red-600";
  return (
    <div className="flex items-center gap-3 text-xs cursor-help">
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
    todo: "bg-zinc-300",
    "in-progress": "bg-zinc-700",
    blocked: "bg-red-600",
    done: "bg-zinc-900",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status] || "bg-zinc-400"}`} />;
}

function Sparkline({ data, color }: { data: number[]; color: "emerald" | "red" | "amber" | "blue" }) {
  const colorClass = color === "emerald" ? "stroke-zinc-800" : color === "red" ? "stroke-red-500" : "stroke-zinc-500";
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

function TooltipLoopMetricBar({ 
  icon, 
  label, 
  value, 
  max, 
  unit, 
  color 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: number; 
  max: number; 
  unit: string;
  color: "emerald" | "amber" | "red" | "blue" | "purple";
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses: Record<string, string> = {
    emerald: "bg-zinc-900",
    amber: "bg-[#FFE135]",
    red: "bg-red-600",
    blue: "bg-blue-500",
    purple: "bg-zinc-700",
  };
  const textColors: Record<string, string> = {
    emerald: "text-zinc-700",
    amber: "text-[#7a6200]",
    red: "text-red-600",
    blue: "text-zinc-700",
    purple: "text-zinc-700",
  };

  return (
    <div className="cursor-help">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
          <span className={textColors[color]}>{icon}</span>
          {label}
        </span>
        <span className={`text-[10px] font-mono ${textColors[color]}`}>
          {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
