"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AgentIcon } from "@/lib/agent-icons";
import { TrendIcon } from "@/lib/ui-icons";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  department: string;
  reportsTo: string;
  directReports: string[];
  personality: string;
  style: string;
  expertise: string[];
  kpis: string[];
  model: { primary: string; fallback: string | null };
  nameReason?: string;
}

interface Relationship {
  trust: number;
  opinion: string;
  lastInteraction: string | null;
  interactionCount: number;
  trend: string;
  history: { date: string; event: string; delta: number }[];
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [relationships, setRelationships] = useState<Record<string, Relationship>>({});

  useEffect(() => {
    fetch("/api/company/roster").then(r => r.json()).then(d => {
      const agents = d.agents || [];
      setAllAgents(agents);
      setAgent(agents.find((a: Agent) => a.id === agentId) || null);
    });
    fetch("/api/company/relationships").then(r => r.json()).then(d => {
      const agentRels = d.relationships?.[agentId];
      if (agentRels) setRelationships(agentRels.relationships || {});
    });
  }, [agentId]);

  if (!agent) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading agent profile...</p>
      </div>
    );
  }

  const agentMap = Object.fromEntries(allAgents.map(a => [a.id, a]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/company" className="text-sm text-foreground hover:underline mb-4 inline-block">← Back to The Core</Link>

      {/* Header */}
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16">
            <AgentIcon emoji={agent.emoji} size={48} className="text-muted-foreground dark:text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-foreground">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.role}</p>
            {agent.nameReason && (
              <p className="text-sm text-muted-foreground italic mt-1">
                &ldquo;Why {agent.name}?&rdquo; — {agent.nameReason}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-secondary text-muted-foreground dark:text-muted-foreground">
                {agent.department}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-foreground">
                {agent.model.primary.split('/').pop()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity Card */}
        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground mb-4">Identity</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Personality</p>
              <p className="text-sm text-zinc-700 dark:text-foreground">{agent.personality}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Communication Style</p>
              <p className="text-sm text-zinc-700 dark:text-foreground">{agent.style}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Expertise</p>
              <div className="flex flex-wrap gap-1">
                {agent.expertise.map(e => (
                  <span key={e} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-secondary text-muted-foreground dark:text-muted-foreground">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">KPIs</p>
              <div className="flex flex-wrap gap-1">
                {agent.kpis.map(k => (
                  <span key={k} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-[#FFE135]">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Reports To</p>
              <div className="flex items-center gap-2">
                {agentMap[agent.reportsTo] && (
                  <>
                    <AgentIcon emoji={agentMap[agent.reportsTo].emoji} size={20} className="text-muted-foreground dark:text-foreground" />
                    <span className="text-sm text-zinc-700 dark:text-foreground">{agentMap[agent.reportsTo].name}</span>
                  </>
                )}
                {!agentMap[agent.reportsTo] && <span className="text-sm text-zinc-700 dark:text-foreground">{agent.reportsTo}</span>}
              </div>
            </div>
            {agent.directReports.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Direct Reports</p>
                <div className="flex gap-3">
                  {agent.directReports.map(rid => {
                    const r = agentMap[rid];
                    return r ? (
                      <Link key={rid} href={`/company/agents/${rid}`} className="flex items-center gap-1.5 text-sm text-foreground hover:underline">
                        <AgentIcon emoji={r.emoji} size={16} className="text-foreground" />
                        {r.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Relationships */}
        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-foreground mb-4">Relationships</h2>

          <div className="space-y-3">
            {Object.entries(relationships)
              .sort(([, a], [, b]) => b.trust - a.trust)
              .map(([otherId, rel]) => {
                const other = agentMap[otherId];
                if (!other) return null;

                const trustColor = rel.trust >= 60 ? "bg-[#FFE135]" : rel.trust >= 40 ? "bg-zinc-400" : rel.trust >= 20 ? "bg-[#FFE135]" : "bg-red-500";

                return (
                  <div key={otherId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/company/agents/${otherId}`} className="flex items-center gap-2 hover:underline">
                        <AgentIcon emoji={other.emoji} size={20} className="text-muted-foreground dark:text-foreground" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-foreground">{other.name}</span>
                      </Link>
                      <div className="flex items-center gap-2">
                        <TrendIcon 
                          trend={rel.trend === "improving" ? "improving" : rel.trend === "declining" ? "declining" : "stable"}
                          size={14}
                          className="text-muted-foreground"
                        />
                        <span className="text-sm font-mono text-muted-foreground dark:text-muted-foreground">{rel.trust}</span>
                      </div>
                    </div>
                    {/* Trust bar */}
                    <div className="w-full h-2 bg-zinc-100 dark:bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${trustColor}`}
                        style={{ width: `${Math.max(0, (rel.trust + 100) / 200 * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground italic">&quot;{rel.opinion}&quot;</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
