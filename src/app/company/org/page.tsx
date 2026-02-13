"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { AgentIcon } from "@/lib/agent-icons";
import { ChevronRight, ChevronDown } from 'lucide-react';


interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  department: string;
  reportsTo: string;
  directReports: string[];
  isHuman?: boolean;
  instance?: string;
  model: { primary: string; fallback: string | null };
}

interface NodePos { x: number; y: number; w: number; h: number; id: string }

export default function OrgChartPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("org-chart-collapsed");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePos>>({});
  const previousPositionsRef = useRef<Record<string, NodePos>>({});

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("org-chart-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || []));
  }, []);

  const registerNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (!el || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const newPosition: NodePos = {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
      id,
    };

    const previousPosition = previousPositionsRef.current[id];

    // Only update state if position has actually changed
    if (!previousPosition ||
        Math.abs(previousPosition.x - newPosition.x) > 0.5 ||
        Math.abs(previousPosition.y - newPosition.y) > 0.5 ||
        Math.abs(previousPosition.w - newPosition.w) > 0.5 ||
        Math.abs(previousPosition.h - newPosition.h) > 0.5) {
      setNodePositions(prev => ({
        ...prev,
        [id]: newPosition,
      }));
      previousPositionsRef.current[id] = newPosition;
    }
  }, []);

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
  const q = agentMap["main"];
  const arty = agentMap["arty"];
  const ella = agentMap["ella"];
  const qReports = agents.filter(a => a.reportsTo === "main" && a.id !== "main");

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build SVG lines between connected nodes
  const lines: { from: string; to: string }[] = [];
  lines.push({ from: "company", to: "pj" });
  lines.push({ from: "company", to: "ella-node" });
  lines.push({ from: "pj", to: "main" });
  lines.push({ from: "ella-node", to: "arty" });
  lines.push({ from: "ella-node", to: "larina" });
  lines.push({ from: "larina", to: "pj" });
  if (!collapsed["main"]) {
    qReports.filter(a => !["design", "testing"].includes(a.id)).forEach(a => {
      lines.push({ from: "main", to: a.id });
      if (!collapsed[a.id]) {
        agents.filter(sub => sub.reportsTo === a.id).forEach(sub => {
          lines.push({ from: a.id, to: sub.id });
        });
      }
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Organisational Chart</h1>
          <p className="text-zinc-500 text-sm mt-1">Villanueva Creative Pty Ltd — {agents.length} team members</p>
        </div>
        <Link href="/company" className="text-sm text-blue-500 hover:underline">← The Core</Link>
      </div>

      {agents.length > 0 && (
        <div ref={containerRef} className="relative min-h-[600px]">
          {/* SVG Layer for connector lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {lines.map(({ from, to }) => {
              const f = nodePositions[from];
              const t = nodePositions[to];
              if (!f || !t) return null;
              const fromBottom = f.y + f.h / 2;
              const toTop = t.y - t.h / 2;
              const midY = (fromBottom + toTop) / 2;
              const isDashed = (from === "ella-node" && to === "arty") || (from === "larina" && to === "pj");
              const pathD = `M ${f.x} ${fromBottom} C ${f.x} ${midY}, ${t.x} ${midY}, ${t.x} ${toTop}`;
              const pathLength = Math.abs(fromBottom - toTop) * 1.5;

              return (
                <g key={`${from}-${to}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    className={`text-zinc-300 dark:text-zinc-700 ${isDashed ? "stroke-dashed" : "draw-in"}`}
                    strokeWidth="2"
                    strokeDasharray={isDashed ? "4 4" : undefined}
                    style={{
                      strokeDashoffset: isDashed ? undefined : pathLength,
                      animation: `drawLine 0.8s ease-out forwards`,
                      animationDelay: `${lines.findIndex(l => l.from === from && l.to === to) * 0.05}s`,
                    }}
                  />
                  {/* Arrow */}
                  <circle cx={t.x} cy={toTop} r="3" className="fill-zinc-300 dark:fill-zinc-700 draw-in-dot" style={{
                    animation: `fadeIn 0.3s ease-out forwards`,
                    animationDelay: `${lines.findIndex(l => l.from === from && l.to === to) * 0.05 + 0.6}s`,
                  }} />
                </g>
              );
            })}
          </svg>

          {/* Animation styles */}
          <style jsx>{`
            @keyframes drawLine {
              from { stroke-dashoffset: ${lines.length * 200}; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .draw-in {
              stroke-dasharray: 1000;
            }
            .draw-in-dot {
              opacity: 0;
            }
            .stroke-dashed {
              stroke-dasharray: 4 4;
            }
          `}</style>

          {/* Nodes */}
          <div className="relative flex flex-col items-center gap-6" style={{ zIndex: 1 }}>
            {/* Company */}
            <div ref={(el) => registerNode("company", el)}>
              <div className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-300 dark:border-amber-700 text-center shadow-lg">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Villanueva Creative Pty Ltd</p>
                <p className="text-[10px] text-amber-500 mt-0.5">Est. Sydney, Australia</p>
              </div>
            </div>

            {/* Two branches */}
            <div className="flex items-start gap-32">
              {/* PJ Branch */}
              <div className="flex flex-col items-center gap-5">
                <div ref={(el) => registerNode("pj", el)}>
                  <OrgCard name="PJ" subtitle="Paul Villanueva" emoji="👑" role="CEO & Founder" color="amber" isHuman size="lg" />
                </div>

                {q && (
                  <div ref={(el) => registerNode("main", el)} onClick={() => toggleCollapse("main")} className="cursor-pointer">
                    <OrgCard name={q.name} emoji={q.emoji} role="COO" model="claude-opus-4-5" color="gold" href={`/company/agents/${q.id}`} size="lg" badge="Mac Mini" expandable collapsed={collapsed["main"]} reportCount={qReports.length} />
                  </div>
                )}

                {/* Department heads */}
                {!collapsed["main"] && (
                  <div className="flex flex-wrap justify-center gap-5 max-w-[700px]">
                    {qReports.filter(a => !["design", "testing"].includes(a.id)).map(agent => {
                      const subs = agents.filter(a => a.reportsTo === agent.id);
                      const hasCollapsible = subs.length > 0;
                      return (
                        <div key={agent.id} className="flex flex-col items-center gap-3">
                          <div
                            ref={(el) => registerNode(agent.id, el)}
                            onClick={hasCollapsible ? () => toggleCollapse(agent.id) : undefined}
                            className={hasCollapsible ? "cursor-pointer" : ""}
                          >
                            <OrgCard
                              name={agent.name}
                              emoji={agent.emoji}
                              role={agent.role}
                              model={agent.model.primary.split("/").pop() || ""}
                              color={getDeptColor(agent.department)}
                              href={`/company/agents/${agent.id}`}
                              badge="Local"
                              expandable={hasCollapsible}
                              collapsed={collapsed[agent.id]}
                              reportCount={subs.length}
                            />
                          </div>
                          {!collapsed[agent.id] && subs.map(sub => (
                            <div key={sub.id} ref={(el) => registerNode(sub.id, el)}>
                              <OrgCard
                                name={sub.name}
                                emoji={sub.emoji}
                                role={sub.role}
                                model={sub.model.primary.split("/").pop() || ""}
                                color={getDeptColor(sub.department)}
                                href={`/company/agents/${sub.id}`}
                                size="sm"
                                badge="Local"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ella Branch */}
              <div className="flex flex-col items-center gap-5">
                <div ref={(el) => registerNode("ella-node", el)}>
                  <OrgCard name={ella?.name || "Ella"} emoji={ella?.emoji || "👩‍🎨"} role="CEO & Co-Founder" color="pink" isHuman size="lg" href={ella ? `/company/agents/ella` : undefined} />
                </div>
                
                {/* Ella's reports side by side */}
                <div className="flex items-start gap-5">
                  <div ref={(el) => registerNode("arty", el)}>
                    <OrgCard name={arty?.name || "Arty"} emoji={arty?.emoji || "🏹"} role="COO / Chief of Staff" model="External" color="mint" href={arty ? `/company/agents/arty` : undefined} badge="VPS" />
                  </div>
                  <div ref={(el) => registerNode("larina", el)}>
                    <OrgCard name="Larina" emoji="✨" role="Lead Designer & AI Manager" color="pink" isHuman />
                  </div>
                </div>
                
                <div className="px-4 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                  <p className="text-[10px] text-zinc-400 text-center">Separate OpenClaw instance</p>
                  <p className="text-[9px] text-zinc-500 text-center mt-0.5">Artemis • VPS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Legend */}
          <div className="mt-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Departments</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DeptBadge name="Executive" color="amber" members={["PJ (CEO)", "Ella (CEO)", "Q (COO)", "Arty (COO)", "Larina (dotted)"]} />
              <DeptBadge name="Creative" color="pink" members={["Aura (Director)", "Prism (Design)", "Larina (Lead Designer)"]} />
              <DeptBadge name="Engineering" color="emerald" members={["Spark (Lead)", "Flux (QA)"]} />
              <DeptBadge name="Growth" color="cyan" members={["Surge (Head)"]} />
              <DeptBadge name="Research" color="blue" members={["Cipher (Head)"]} />
              <DeptBadge name="Events" color="orange" members={["Volt (Manager)"]} />
              <DeptBadge name="Support" color="sky" members={["Echo (Lead)"]} />
              <DeptBadge name="Community" color="zinc" members={["Luna (Discord)"]} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">Mac Mini</span>
                <span>M4 32GB — Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-medium">VPS</span>
                <span>Ella&apos;s instance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-zinc-900" />
                <span>Human</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">- - -</span>
                <span>Cross-instance link</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgCard({
  name, emoji, subtitle, role, model, color, href, size, isHuman, badge, expandable, collapsed, reportCount,
}: {
  name: string; emoji?: string; subtitle?: string; role: string; model?: string;
  color: string; href?: string; size?: "sm" | "lg"; isHuman?: boolean; badge?: string;
  expandable?: boolean; collapsed?: boolean; reportCount?: number;
}) {
  const sizeClass = size === "lg" ? "px-6 py-4 min-w-[160px]" : size === "sm" ? "px-3 py-2 min-w-[90px]" : "px-4 py-3 min-w-[120px]";
  const textSize = size === "lg" ? "text-sm" : size === "sm" ? "text-xs" : "text-xs";

  const colorClasses: Record<string, string> = {
    amber: "border-amber-300 dark:border-amber-600 bg-white dark:bg-zinc-900",
    gold: "border-yellow-400 dark:border-yellow-600 bg-white dark:bg-zinc-900",
    pink: "border-pink-300 dark:border-pink-600 bg-white dark:bg-zinc-900",
    mint: "border-emerald-300 dark:border-emerald-600 bg-white dark:bg-zinc-900",
    emerald: "border-emerald-300 dark:border-emerald-600 bg-white dark:bg-zinc-900",
    cyan: "border-cyan-300 dark:border-cyan-600 bg-white dark:bg-zinc-900",
    blue: "border-blue-300 dark:border-blue-600 bg-white dark:bg-zinc-900",
    orange: "border-orange-300 dark:border-orange-600 bg-white dark:bg-zinc-900",
    sky: "border-sky-300 dark:border-sky-600 bg-white dark:bg-zinc-900",
    zinc: "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900",
  };

  const inner = (
    <div className={`relative rounded-xl border-2 shadow-md hover:shadow-lg transition-all ${colorClasses[color] || colorClasses.zinc} ${sizeClass} text-center`}>
      {isHuman && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-zinc-900" title="Human" />
      )}
      {badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${badge === "VPS" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"}`}>
            {badge}
          </span>
        </div>
      )}
      {emoji && <AgentIcon emoji={emoji} size={size === "lg" ? 32 : size === "sm" ? 18 : 24} className="mx-auto text-zinc-600 dark:text-zinc-300" />}
      <p className={`font-bold text-zinc-900 dark:text-zinc-100 ${textSize}`}>{name}</p>
      {subtitle && <p className="text-[10px] text-zinc-400">{subtitle}</p>}
      <p className="text-[11px] text-zinc-500">{role}</p>
      {model && <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{model}</p>}
      {expandable && (
        <div className="mt-1 text-[9px] text-zinc-400 flex items-center justify-center gap-1">
          {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          <span>{reportCount} reports</span>
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href} onClick={e => e.stopPropagation()}>{inner}</Link>;
  return inner;
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
