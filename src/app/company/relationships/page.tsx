"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Link as LinkIcon, X } from "lucide-react";
import { AgentIcon } from "@/lib/agent-icons";
import { TrendIcon } from "@/lib/ui-icons";

interface RelEntry {
  trust: number;
  opinion: string;
  interactionCount: number;
  trend: string;
  lastInteraction: string | null;
}

interface AgentRels {
  agentId: string;
  agentName: string;
  relationships: Record<string, RelEntry>;
}

interface GraphNode {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  from: string;
  to: string;
  trust: number;
  interactions: number;
}

const AGENT_COLORS: Record<string, string> = {
  main: "#FFD700", creative: "#FF69B4", design: "#DDA0DD", growth: "#00CED1",
  research: "#4169E1", dev: "#32CD32", testing: "#FF6347", events: "#FF8C00",
  support: "#87CEEB", luna: "#C0C0C0",
};

const AGENT_EMOJIS: Record<string, string> = {
  main: "🦾", creative: "🎨", design: "✏️", growth: "📈",
  research: "🔬", dev: "💻", testing: "🧪", events: "🎪",
  support: "💬", luna: "🌙",
};

export default function RelationshipsPage() {
  const [relData, setRelData] = useState<AgentRels[]>([]);
  const [view, setView] = useState<"graph" | "matrix">("graph");
  const [selectedPair, setSelectedPair] = useState<{ from: string; to: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch("/api/company/relationships").then(r => r.json()).then(d => setRelData(d.agents || []));
  }, []);

  // Build graph data
  useEffect(() => {
    if (relData.length === 0) return;
    const agentIds = relData.map(a => a.agentId).filter(id => !["ella", "arty"].includes(id));
    const cx = 400, cy = 300, radius = 200;

    nodesRef.current = agentIds.map((id, i) => ({
      id,
      name: relData.find(a => a.agentId === id)?.agentName || id,
      emoji: AGENT_EMOJIS[id] || "💬",
      x: cx + radius * Math.cos((2 * Math.PI * i) / agentIds.length - Math.PI / 2),
      y: cy + radius * Math.sin((2 * Math.PI * i) / agentIds.length - Math.PI / 2),
      vx: 0,
      vy: 0,
    }));

    // Run force simulation for a few iterations
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();
    relData.forEach(agent => {
      if (["ella", "arty"].includes(agent.agentId)) return;
      Object.entries(agent.relationships).forEach(([otherId, rel]) => {
        if (["ella", "arty"].includes(otherId)) return;
        const key = [agent.agentId, otherId].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ from: agent.agentId, to: otherId, trust: rel.trust, interactions: rel.interactionCount });
        }
      });
    });

    // Simple force simulation
    for (let iter = 0; iter < 100; iter++) {
      const nodes = nodesRef.current;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 5000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodes[i].vx += fx;
          nodes[i].vy += fy;
          nodes[j].vx -= fx;
          nodes[j].vy -= fy;
        }
      }

      // Attraction along edges (more interactions = stronger attraction)
      edges.forEach(edge => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (!from || !to) return;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const strength = 0.01 * Math.log(edge.interactions + 1); // More interactions = stronger pull
        const fx = dx * strength;
        const fy = dy * strength;

        from.vx += fx;
        from.vy += fy;
        to.vx -= fx;
        to.vy -= fy;
      });

      // Center gravity
      nodes.forEach(node => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * 0.005;
        node.vy += dy * 0.005;
      });

      // Apply velocity
      nodes.forEach(node => {
        node.x += node.vx * 0.1;
        node.y += node.vy * 0.1;
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;
      });
    }

    edgesRef.current = edges;
  }, [relData]);

  // Canvas rendering
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    ctx.clearRect(0, 0, 800, 600);

    // Draw edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      const trust = edge.trust;
      const alpha = Math.max(0.1, trust / 100);
      const width = Math.max(0.5, (trust / 100) * 4);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = trust >= 60 ? `rgba(34,197,94,${alpha})` : trust >= 40 ? `rgba(234,179,8,${alpha})` : `rgba(239,68,68,${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();

      // Trust label on hover
      if (hoveredNode === edge.from || hoveredNode === edge.to) {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = "#71717a";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${trust}`, mx, my - 4);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const color = AGENT_COLORS[node.id] || "#888";
      const isHovered = hoveredNode === node.id;
      const r = isHovered ? 28 : 22;

      // Glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = `${color}22`;
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#18181b";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Emoji
      ctx.font = `${isHovered ? 18 : 14}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.emoji, node.x, node.y);

      // Name
      ctx.fillStyle = color;
      ctx.font = `bold ${isHovered ? 12 : 10}px sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(node.name, node.x, node.y + r + 4);
    });

    animRef.current = requestAnimationFrame(draw);
  }, [hoveredNode]);

  useEffect(() => {
    if (view === "graph" && nodesRef.current.length > 0) {
      animRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [view, draw, relData]);

  // Mouse hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const found = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < 28);
    setHoveredNode(found?.id || null);
  };

  // Build matrix data
  const localAgents = relData.filter(a => !["ella", "arty"].includes(a.agentId));
  const agentIds = localAgents.map(a => a.agentId);

  const getRelation = (from: string, to: string): RelEntry | null => {
    const agent = relData.find(a => a.agentId === from);
    return agent?.relationships?.[to] || null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LinkIcon size={24} />
            Relationships
          </h1>
          <p className="text-zinc-500 text-sm">Trust scores and interaction patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("graph")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "graph" ? "bg-blue-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
            Graph
          </button>
          <button onClick={() => setView("matrix")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "matrix" ? "bg-blue-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
            Matrix
          </button>
          <Link href="/company" className="text-xs text-blue-500 hover:underline ml-4">← HQ</Link>
        </div>
      </div>

      {view === "graph" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full"
              onMouseMove={handleMouseMove}
              onClick={() => {
                if (hoveredNode) setSelectedPair(null);
              }}
            />
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Legend</h3>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-emerald-500" /> High trust (60+)</div>
                <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-amber-500" /> Neutral (40-59)</div>
                <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-red-500" /> Low trust (&lt;40)</div>
                <div className="flex items-center gap-2"><span className="text-zinc-400">Line thickness</span> = trust level</div>
              </div>
            </div>
            {hoveredNode && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-1.5">
                  <AgentIcon emoji={AGENT_EMOJIS[hoveredNode]} size={14} />
                  {relData.find(a => a.agentId === hoveredNode)?.agentName}
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(relData.find(a => a.agentId === hoveredNode)?.relationships || {})
                    .filter(([id]) => !["ella", "arty"].includes(id))
                    .sort(([,a], [,b]) => b.trust - a.trust)
                    .map(([id, rel]) => (
                    <div key={id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <AgentIcon emoji={AGENT_EMOJIS[id]} size={12} />
                        {relData.find(a => a.agentId === id)?.agentName || id}
                      </span>
                      <TrustBadge trust={rel.trust} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Matrix View */
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-zinc-500 font-medium">Agent</th>
                {localAgents.map(a => (
                  <th key={a.agentId} className="p-2 text-center text-zinc-500 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <AgentIcon emoji={AGENT_EMOJIS[a.agentId]} size={14} />
                      <span className="text-[10px]">{a.agentName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localAgents.map(agent => (
                <tr key={agent.agentId} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-2 font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <AgentIcon emoji={AGENT_EMOJIS[agent.agentId]} size={14} />
                    {agent.agentName}
                  </td>
                  {agentIds.map(otherId => {
                    if (agent.agentId === otherId) {
                      return <td key={otherId} className="p-2 text-center text-zinc-300 dark:text-zinc-700">—</td>;
                    }
                    const rel = getRelation(agent.agentId, otherId);
                    return (
                      <td
                        key={otherId}
                        className="p-2 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                        onClick={() => setSelectedPair({ from: agent.agentId, to: otherId })}
                      >
                        <TrustBadge trust={rel?.trust ?? 50} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Detail panel */}
          {selectedPair && (() => {
            const rel = getRelation(selectedPair.from, selectedPair.to);
            if (!rel) return null;
            const fromName = relData.find(a => a.agentId === selectedPair.from)?.agentName;
            const toName = relData.find(a => a.agentId === selectedPair.to)?.agentName;
            return (
              <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <AgentIcon emoji={AGENT_EMOJIS[selectedPair.from]} size={14} />
                    {fromName} →
                    <AgentIcon emoji={AGENT_EMOJIS[selectedPair.to]} size={14} />
                    {toName}
                  </h4>
                  <button onClick={() => setSelectedPair(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-zinc-500">Trust</p>
                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{rel.trust}/100</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Interactions</p>
                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{rel.interactionCount}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Trend</p>
                    <p className="font-bold text-lg flex items-center gap-1.5">
                      <TrendIcon 
                        trend={rel.trend === "up" ? "improving" : rel.trend === "down" ? "declining" : "stable"} 
                        size={18} 
                      />
                      {rel.trend}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2 italic">&quot;{rel.opinion}&quot;</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function TrustBadge({ trust }: { trust: number }) {
  const color = trust >= 60 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
    : trust >= 40 ? "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
    : "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>{trust}</span>;
}
