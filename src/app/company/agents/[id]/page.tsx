"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  style: string;
  expertise: string[];
  kpis: string[];
  model: { primary: string; fallback: string | null };
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
        <p className="text-zinc-500">Loading agent profile...</p>
      </div>
    );
  }

  const agentMap = Object.fromEntries(allAgents.map(a => [a.id, a]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/company" className="text-sm text-blue-500 hover:underline mb-4 inline-block">← Back to Company HQ</Link>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{agent.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{agent.name}</h1>
            <p className="text-zinc-500">{agent.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {agent.department}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {agent.model.primary.split('/').pop()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Identity</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Personality</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{agent.personality}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Communication Style</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{agent.style}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Expertise</p>
              <div className="flex flex-wrap gap-1">
                {agent.expertise.map(e => (
                  <span key={e} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">KPIs</p>
              <div className="flex flex-wrap gap-1">
                {agent.kpis.map(k => (
                  <span key={k} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Reports To</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {agentMap[agent.reportsTo] ? `${agentMap[agent.reportsTo].emoji} ${agentMap[agent.reportsTo].name}` : agent.reportsTo}
              </p>
            </div>
            {agent.directReports.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Direct Reports</p>
                <div className="flex gap-2">
                  {agent.directReports.map(rid => {
                    const r = agentMap[rid];
                    return r ? (
                      <Link key={rid} href={`/company/agents/${rid}`} className="text-sm text-blue-500 hover:underline">
                        {r.emoji} {r.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Relationships */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Relationships</h2>

          <div className="space-y-3">
            {Object.entries(relationships)
              .sort(([, a], [, b]) => b.trust - a.trust)
              .map(([otherId, rel]) => {
                const other = agentMap[otherId];
                if (!other) return null;

                const trustColor = rel.trust >= 60 ? "bg-emerald-500" : rel.trust >= 40 ? "bg-zinc-400" : rel.trust >= 20 ? "bg-amber-500" : "bg-red-500";
                const trendIcon = rel.trend === "improving" ? "📈" : rel.trend === "declining" ? "📉" : "➡️";

                return (
                  <div key={otherId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/company/agents/${otherId}`} className="flex items-center gap-2 hover:underline">
                        <span>{other.emoji}</span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{other.name}</span>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{trendIcon}</span>
                        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{rel.trust}</span>
                      </div>
                    </div>
                    {/* Trust bar */}
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${trustColor}`}
                        style={{ width: `${Math.max(0, (rel.trust + 100) / 200 * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 italic">&quot;{rel.opinion}&quot;</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
