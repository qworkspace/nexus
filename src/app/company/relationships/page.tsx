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
  history?: Array<{
    date: string;
    event: string;
    delta: number;
  }>;
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
  const [view, setView] = useState<"graph" | "matrix" | "timeline">("graph");
  const [selectedPair, setSelectedPair] = useState<{ from: string; to: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      // Draw directional arrow
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const arrowSize = 6;
      const arrowOffset = 25; // Offset from node edge

      ctx.save();
      ctx.translate(
        from.x + Math.cos(angle) * arrowOffset,
        from.y + Math.sin(angle) * arrowOffset
      );
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.closePath();
      ctx.fillStyle = trust >= 60 ? '#22c55e' : trust >= 40 ? '#eab308' : '#ef4444';
      ctx.fill();
      ctx.restore();

      // Draw interaction count if > 0
      if (edge.interactions > 0) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.roundRect(midX - 8, midY - 6, 16, 12, 3);
        ctx.fill();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(edge.interactions), midX, midY);
      }

      // Trust label on hover
      if (hoveredNode === edge.from || hoveredNode === edge.to) {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = "#71717a";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${trust}`, mx, my - 12);
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

      // Agent initial
      ctx.font = `bold ${isHovered ? 16 : 12}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(node.name.charAt(0).toUpperCase(), node.x, node.y);

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
          <button onClick={() => setView("graph")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "graph" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
            Graph
          </button>
          <button onClick={() => setView("matrix")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "matrix" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
            Matrix
          </button>
          <button onClick={() => setView("timeline")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "timeline" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
            Timeline
          </button>
          <Link href="/company" className="text-xs text-zinc-500 hover:text-foreground hover:underline ml-4">← HQ</Link>
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
                <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-zinc-800" /> High trust (60+)</div>
                <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-[#FFE135]" /> Neutral (40-59)</div>
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
      ) : view === "matrix" ? (
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
                        <div className="flex flex-col items-center gap-1">
                          <TrustBadge trust={rel?.trust ?? 50} />
                          {rel?.lastInteraction && (
                            <span className="text-[9px] text-zinc-400">
                              {(() => {
                                const date = new Date(rel.lastInteraction);
                                const now = new Date();
                                const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays === 0) return 'today';
                                if (diffDays === 1) return 'yesterday';
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return date.toLocaleDateString();
                              })()}
                            </span>
                          )}
                        </div>
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
      ) : view === "timeline" ? (
        <TimelineView relData={relData} />
      ) : null}
    </div>
  );
}

function TimelineView({ relData }: { relData: AgentRels[] }) {
  type TimelineEvent = {
    date: string;
    fromAgent: string;
    fromName: string;
    toAgent: string;
    toName: string;
    event: string;
    delta: number;
  };

  const allEvents: TimelineEvent[] = [];
  relData.forEach(agent => {
    Object.entries(agent.relationships || {}).forEach(([targetId, rel]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const history = (rel as any).history || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history.forEach((entry: any) => {
        allEvents.push({
          date: entry.date,
          fromAgent: agent.agentId,
          fromName: agent.agentName,
          toAgent: targetId,
          toName: relData.find(a => a.agentId === targetId)?.agentName || targetId,
          event: entry.event,
          delta: entry.delta,
        });
      });
    });
  });

  const sorted = allEvents.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Recent Interactions
      </h3>
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No interactions recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 20).map((evt, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs">
                  <AgentIcon emoji={AGENT_EMOJIS[evt.fromAgent]} size={14} />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {evt.fromName}
                  </span>
                  <span className="text-zinc-400">→</span>
                  <AgentIcon emoji={AGENT_EMOJIS[evt.toAgent]} size={14} />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {evt.toName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {formatRelativeTime(evt.date)}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      evt.delta > 0
                        ? 'text-zinc-600'
                        : evt.delta < 0
                        ? 'text-red-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    {evt.delta > 0 && '+'}
                    {evt.delta}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {evt.event}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrustBadge({ trust }: { trust: number }) {
  const color = trust >= 60 ? "text-zinc-600 bg-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-500"
    : trust >= 40 ? "text-[#FFE135] bg-zinc-100 dark:bg-[#FFE135]/30 dark:text-[#FFE135]"
    : "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>{trust}</span>;
}
