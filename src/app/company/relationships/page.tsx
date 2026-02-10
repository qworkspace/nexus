"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GraphNode {
  id: string;
  name: string;
  emoji: string;
  role: string;
  department: string;
}

interface GraphEdge {
  source: string;
  target: string;
  trustA: number;
  trustB: number;
  avgTrust: number;
}

interface RelationshipData {
  trust: number;
  opinion: string;
  lastInteraction: string | null;
  interactionCount: number;
  trend: string;
  history: { date: string; event: string; delta: number }[];
}

export default function RelationshipsPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [allRels, setAllRels] = useState<Record<string, { relationships: Record<string, RelationshipData> }>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company/relationships/graph").then(r => r.json()).then(d => {
      setNodes(d.nodes || []);
      setEdges(d.edges || []);
    });
    fetch("/api/company/relationships").then(r => r.json()).then(d => {
      setAllRels(d.relationships || {});
    });
  }, []);

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Sort edges by trust
  const sortedEdges = [...edges].sort((a, b) => b.avgTrust - a.avgTrust);
  const strongestPairs = sortedEdges.slice(0, 5);
  const weakestPairs = [...sortedEdges].reverse().slice(0, 5);

  const trustColor = (trust: number) => {
    if (trust >= 70) return "text-emerald-500";
    if (trust >= 60) return "text-emerald-400";
    if (trust >= 40) return "text-zinc-400";
    if (trust >= 20) return "text-amber-500";
    return "text-red-500";
  };

  const trustBg = (trust: number) => {
    if (trust >= 70) return "bg-emerald-500";
    if (trust >= 60) return "bg-emerald-400";
    if (trust >= 40) return "bg-zinc-400";
    if (trust >= 20) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/company" className="text-sm text-blue-500 hover:underline mb-2 inline-block">← Company HQ</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">🤝 Relationship Map</h1>
      <p className="text-zinc-500 text-sm mb-6">{nodes.length} agents • {edges.length} connections</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Trust Matrix</h2>

          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-zinc-500"></th>
                {nodes.map(n => (
                  <th key={n.id} className="p-2 text-center">
                    <span className="text-lg">{n.emoji}</span>
                    <br />
                    <span className="text-zinc-500">{n.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map(row => (
                <tr key={row.id}>
                  <td className="p-2 font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="text-lg mr-1">{row.emoji}</span>
                    {row.name}
                  </td>
                  {nodes.map(col => {
                    if (row.id === col.id) {
                      return <td key={col.id} className="p-2 text-center text-zinc-300 dark:text-zinc-700">—</td>;
                    }
                    const rel = allRels[row.id]?.relationships?.[col.id];
                    const trust = rel?.trust ?? 50;
                    return (
                      <td
                        key={col.id}
                        className="p-2 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                        onClick={() => setSelected(`${row.id}:${col.id}`)}
                      >
                        <span className={`font-mono font-bold ${trustColor(trust)}`}>{trust}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected relationship detail */}
          {selected && (() => {
            const [fromId, toId] = selected.split(":");
            const from = nodeMap[fromId];
            const to = nodeMap[toId];
            const rel = allRels[fromId]?.relationships?.[toId];
            if (!from || !to || !rel) return null;

            return (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  {from.emoji} {from.name} → {to.emoji} {to.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Trust</span>
                    <span className={`text-lg font-bold ${trustColor(rel.trust)}`}>{rel.trust}/100</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${trustBg(rel.trust)}`} style={{ width: `${(rel.trust + 100) / 200 * 100}%` }} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Opinion</p>
                    <p className="text-sm italic text-zinc-600 dark:text-zinc-400">&quot;{rel.opinion}&quot;</p>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Interactions: {rel.interactionCount}</span>
                    <span>Last: {rel.lastInteraction || "Never"}</span>
                  </div>
                  {rel.history.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">History</p>
                      {rel.history.slice(-5).map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={h.delta > 0 ? "text-emerald-500" : "text-red-500"}>
                            {h.delta > 0 ? "+" : ""}{h.delta}
                          </span>
                          <span className="text-zinc-500">{h.event}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Leaderboard */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🏆 Strongest Bonds</h3>
            <div className="space-y-2">
              {strongestPairs.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {nodeMap[e.source]?.emoji} {nodeMap[e.source]?.name} ↔ {nodeMap[e.target]?.emoji} {nodeMap[e.target]?.name}
                  </span>
                  <span className={`font-mono ${trustColor(e.avgTrust)}`}>{e.avgTrust.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">⚠️ Needs Attention</h3>
            <div className="space-y-2">
              {weakestPairs.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {nodeMap[e.source]?.emoji} {nodeMap[e.source]?.name} ↔ {nodeMap[e.target]?.emoji} {nodeMap[e.target]?.name}
                  </span>
                  <span className={`font-mono ${trustColor(e.avgTrust)}`}>{e.avgTrust.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
