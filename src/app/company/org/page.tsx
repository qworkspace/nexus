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
  isHuman?: boolean;
  instance?: string;
  model: { primary: string; fallback: string | null };
}

export default function OrgChartPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || []));
  }, []);

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
  const q = agentMap["main"];
  const arty = agentMap["arty"];
  const ella = agentMap["ella"];
  const qReports = agents.filter(a => a.reportsTo === "main" && a.id !== "main");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Organisational Chart</h1>
          <p className="text-zinc-500 text-sm mt-1">Villanueva Creative Pty Ltd — {agents.length} team members</p>
        </div>
        <Link href="/company" className="text-sm text-blue-500 hover:underline">← Company HQ</Link>
      </div>

      {agents.length === 0 && <p className="text-zinc-500">Loading...</p>}
      {agents.length > 0 && (
        <div className="flex flex-col items-center">
          
          {/* Level 0: Company */}
          <div className="mb-2">
            <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-300 dark:border-amber-700 text-center">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Villanueva Creative Pty Ltd</p>
            </div>
          </div>
          <Connector />

          {/* Level 1: Two independent branches */}
          <div className="flex items-start gap-24 mb-6">
            {/* PJ's branch */}
            <div className="flex flex-col items-center">
              <OrgCard name="PJ" subtitle="Paul Villanueva" role="CEO" color="amber" isHuman />
              <Connector />
              {q && <OrgCard name={q.name} emoji={q.emoji} role={q.role} model="Opus 4.5" color="gold" href={`/company/agents/${q.id}`} badge="Local" />}
              <Connector />
              {/* Department Heads under Q */}
              <div className="flex flex-wrap justify-center gap-4">
                {qReports.filter(a => !["design", "testing"].includes(a.id)).map(agent => {
                  const subs = agents.filter(a => a.reportsTo === agent.id);
                  return (
                    <div key={agent.id} className="flex flex-col items-center">
                      <OrgCard
                        name={agent.name}
                        emoji={agent.emoji}
                        role={agent.role}
                        model={agent.model.primary.split("/").pop() || ""}
                        color={getDeptColor(agent.department)}
                        href={`/company/agents/${agent.id}`}
                        small
                        badge="Local"
                      />
                      {subs.length > 0 && (
                        <>
                          <Connector short />
                          <div className="flex gap-2">
                            {subs.map(sub => (
                              <OrgCard
                                key={sub.id}
                                name={sub.name}
                                emoji={sub.emoji}
                                role={sub.role}
                                model={sub.model.primary.split("/").pop() || ""}
                                color={getDeptColor(sub.department)}
                                href={`/company/agents/${sub.id}`}
                                small
                                badge="Local"
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ella's branch — self-contained */}
            <div className="flex flex-col items-center">
              <OrgCard name={ella?.name || "Ella"} emoji={ella?.emoji || "👩‍🎨"} role="CEO" color="pink" isHuman href={ella ? `/company/agents/ella` : undefined} />
              <Connector />
              <OrgCard name={arty?.name || "Arty"} emoji={arty?.emoji || "🏹"} role={arty?.role || "COO"} model="External" color="mint" href={arty ? `/company/agents/arty` : undefined} badge="VPS" />
              <div className="mt-3 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-[10px] text-zinc-400 text-center">Separate OpenClaw instance</p>
              </div>
            </div>
          </div>

          {/* Department Heads section removed from here — now inline above */}

          {/* Department Legend */}
          <div className="mt-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-3xl">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Departments</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DeptBadge name="Executive" color="amber" members={["PJ", "Ella", "Q 🦾", "Arty 🏹"]} />
              <DeptBadge name="Creative" color="pink" members={["Muse 🎨", "Pixel ✏️"]} />
              <DeptBadge name="Engineering" color="emerald" members={["Forge 💻", "Probe 🧪"]} />
              <DeptBadge name="Growth" color="cyan" members={["Vector 📈"]} />
              <DeptBadge name="Research" color="blue" members={["Atlas 🔬"]} />
              <DeptBadge name="Events" color="orange" members={["Volt 🎪"]} />
              <DeptBadge name="Support" color="sky" members={["Echo 💬"]} />
              <DeptBadge name="Community" color="zinc" members={["Luna 🌙"]} />
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">Local</span>
                <span>Running on Mac Mini</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-medium">VPS</span>
                <span>Running on VPS (Ella&apos;s instance)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Human</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgCard({
  name, emoji, subtitle, role, model, color, href, small, isHuman, badge,
}: {
  name: string; emoji?: string; subtitle?: string; role: string; model?: string;
  color: string; href?: string; small?: boolean; isHuman?: boolean; badge?: string;
}) {
  const colorClasses: Record<string, string> = {
    amber: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10",
    gold: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10",
    pink: "border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/10",
    mint: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10",
    emerald: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10",
    cyan: "border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10",
    blue: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10",
    orange: "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10",
    sky: "border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/10",
    zinc: "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50",
    violet: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/10",
  };

  const content = (
    <div className={`relative rounded-xl border-2 ${colorClasses[color] || colorClasses.zinc} ${href ? "hover:shadow-lg transition-shadow cursor-pointer" : ""} ${small ? "px-3 py-2 min-w-[90px]" : "px-5 py-3 min-w-[140px]"} text-center`}>
      {/* Human indicator */}
      {isHuman && (
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white dark:border-zinc-900" title="Human" />
      )}
      {/* Instance badge */}
      {badge && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${badge === "VPS" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
            {badge}
          </span>
        </div>
      )}
      {emoji && <span className={small ? "text-xl" : "text-2xl"}>{emoji}</span>}
      <p className={`font-bold text-zinc-900 dark:text-zinc-100 ${small ? "text-xs" : "text-sm"}`}>{name}</p>
      {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
      <p className={`text-zinc-500 ${small ? "text-[9px]" : "text-[11px]"}`}>{role}</p>
      {model && <p className={`text-zinc-400 ${small ? "text-[8px]" : "text-[10px]"} mt-0.5 font-mono`}>{model}</p>}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function Connector({ short }: { short?: boolean }) {
  return <div className={`w-px ${short ? "h-3" : "h-5"} bg-zinc-300 dark:bg-zinc-700`} />;
}

function DeptBadge({ name, color, members }: { name: string; color: string; members: string[] }) {
  const dotColors: Record<string, string> = {
    amber: "bg-amber-400", pink: "bg-pink-400", emerald: "bg-emerald-400",
    cyan: "bg-cyan-400", blue: "bg-blue-400", orange: "bg-orange-400",
    sky: "bg-sky-400", zinc: "bg-zinc-400",
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColors[color] || "bg-zinc-400"}`} />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{name}</span>
      </div>
      {members.map(m => (
        <p key={m} className="text-[10px] text-zinc-500 pl-4">{m}</p>
      ))}
    </div>
  );
}

function getDeptColor(dept: string): string {
  const map: Record<string, string> = {
    executive: "amber", creative: "pink", engineering: "emerald",
    growth: "cyan", research: "blue", events: "orange",
    support: "sky", operations: "zinc", community: "zinc",
  };
  return map[dept] || "zinc";
}
