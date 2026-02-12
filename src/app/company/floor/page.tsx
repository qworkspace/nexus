"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, X as XIcon } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  department: string;
  personality: string;
  model: { primary: string; fallback: string | null };
}

interface MeetingLine {
  speaker: string;
  emoji: string;
  text: string;
}

interface FloorSnapshot {
  timestamp: number;
  agents: Record<string, {
    status: 'working' | 'idle' | 'errored' | 'dead';
    activity: string;
    position: { x: number; y: number };
  }>;
}

interface LiveAgentState {
  state: 'working' | 'meeting' | 'idle' | 'walking';
  activity: string;
  bobPhase: number;
  lastActive: string;
  tokens?: number;
  status?: 'working' | 'idle' | 'errored' | 'dead';
  handoff?: { from: string; to: string; task: string } | null;
  buildCelebration?: { agentId: string; buildName: string } | null;
  lastMessage?: string;
}

// Pixel art colours per agent
const AGENT_COLORS: Record<string, { body: string; accent: string; label: string }> = {
  main:     { body: "#FFD700", accent: "#FFA500", label: "#FFD700" },   // Gold
  creative: { body: "#FF69B4", accent: "#FF1493", label: "#FF69B4" },   // Pink
  design:   { body: "#DDA0DD", accent: "#BA55D3", label: "#DDA0DD" },   // Purple-pink
  growth:   { body: "#00CED1", accent: "#008B8B", label: "#00CED1" },   // Teal
  research: { body: "#4169E1", accent: "#0000CD", label: "#6495ED" },   // Blue
  dev:      { body: "#32CD32", accent: "#228B22", label: "#32CD32" },   // Green
  testing:  { body: "#FF6347", accent: "#DC143C", label: "#FF6347" },   // Red-orange
  events:   { body: "#FF8C00", accent: "#FF4500", label: "#FF8C00" },   // Orange
  support:  { body: "#87CEEB", accent: "#4682B4", label: "#87CEEB" },   // Sky blue
  luna:     { body: "#C0C0C0", accent: "#808080", label: "#C0C0C0" },   // Silver
  ella:     { body: "#FFB6C1", accent: "#DB7093", label: "#FFB6C1" },
  arty:     { body: "#98FB98", accent: "#3CB371", label: "#98FB98" },
};

// Desk positions (pixel grid coords, will be scaled)
const DESK_POSITIONS: Record<string, { x: number; y: number; row: number }> = {
  main:     { x: 420, y: 80, row: 0 },
  creative: { x: 120, y: 220, row: 1 },
  growth:   { x: 320, y: 220, row: 1 },
  research: { x: 520, y: 220, row: 1 },
  dev:      { x: 720, y: 220, row: 1 },
  design:   { x: 120, y: 360, row: 2 },
  events:   { x: 320, y: 360, row: 2 },
  support:  { x: 520, y: 360, row: 2 },
  testing:  { x: 720, y: 360, row: 2 },
  luna:     { x: 420, y: 500, row: 3 },
};

// Meeting table gather positions
const MEETING_GATHER: Record<string, { x: number; y: number }> = {
  main:     { x: 420, y: 420 },
  creative: { x: 280, y: 440 },
  growth:   { x: 560, y: 440 },
  design:   { x: 260, y: 500 },
  research: { x: 580, y: 500 },
  dev:      { x: 540, y: 540 },
  testing:  { x: 460, y: 560 },
  events:   { x: 320, y: 540 },
  support:  { x: 380, y: 560 },
  luna:     { x: 420, y: 580 },
};

const ACTIVITIES: Record<string, string[]> = {
  main: ["Coordinating team", "Checking reports", "Planning sprint"],
  creative: ["Designing campaign", "Brand review", "Content brief"],
  design: ["UI polish", "Design system", "Asset creation"],
  growth: ["Analysing metrics", "Funnel optimisation", "A/B testing"],
  research: ["Market intel", "Trend analysis", "Deep dive"],
  dev: ["Writing code", "Shipping feature", "Code review"],
  testing: ["Running tests", "Edge case hunt", "Bug hunting"],
  events: ["Event planning", "Lineup coordination", "Venue logistics"],
  support: ["Resolving tickets", "User feedback", "Doc updates"],
  luna: ["Discord monitoring", "Community chat", "Posting digest"],
  ella: ["Creating artwork", "Pattern spotting", "Art direction"],
  arty: ["Ella's schedule", "Brand consistency", "Creative ops"],
};

export default function FloorPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [meetingMode, setMeetingMode] = useState(false);
  const [meetingLines, setMeetingLines] = useState<MeetingLine[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [agentStates, setAgentStates] = useState<Record<string, LiveAgentState>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ agent: string; name: string; text: string }>>([]);
  const [walkingAgents, setWalkingAgents] = useState<Record<string, { targetId: string }>>({});
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(Date.now());
  const [timelineSnapshots, setTimelineSnapshots] = useState<FloorSnapshot[]>([]);
  const agentsRef = useRef<Agent[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Load roster once
  useEffect(() => {
    const loadRoster = async () => {
      try {
        const res = await fetch("/api/company/roster");
        const data = await res.json();
        const agts: Agent[] = data.agents || [];
        setAgents(agts);

        // Set initial states
        const states: Record<string, LiveAgentState> = {};
        agts.forEach((a) => {
          states[a.id] = {
            state: 'idle',
            activity: ACTIVITIES[a.id]?.[0] || "Working...",
            bobPhase: 0,
            lastActive: new Date().toISOString(),
            tokens: 0,
            status: 'dead',
            handoff: null,
            buildCelebration: null,
            lastMessage: '',
          };
        });
        setAgentStates(states);
      } catch (err) {
        console.error("Failed to load roster:", err);
      }
    };

    loadRoster();
  }, []);

  // SSE connection for live agent states
  useEffect(() => {
    if (timelineMode) return; // Don't poll during timeline replay

    const eventSource = new EventSource('/api/company/floor-pulse');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'states') {
          setAgentStates((prev) => {
            const next = { ...prev };
            
            data.agents.forEach((agent: {
              id: string;
              status: 'working' | 'idle' | 'errored' | 'dead';
              tokens: number;
              lastMessage: string;
              handoff: { from: string; to: string; task: string } | null;
              buildCelebration: { agentId: string; buildName: string } | null;
            }) => {
              next[agent.id] = {
                state: agent.status === 'working' ? 'working' : 
                       agent.status === 'errored' ? 'idle' : 
                       agent.status === 'dead' ? 'idle' : 'idle',
                activity: agent.lastMessage || prev[agent.id]?.activity || ACTIVITIES[agent.id]?.[0] || 'Idle',
                bobPhase: prev[agent.id]?.bobPhase || 0,
                lastActive: new Date().toISOString(),
                tokens: agent.tokens,
                status: agent.status,
                handoff: agent.handoff,
                buildCelebration: agent.buildCelebration,
                lastMessage: agent.lastMessage,
              };
            });
            
            return next;
          });
        }

        if (data.type === 'error') {
          console.error('Floor pulse error:', data);
          // Show grey state for all agents (offline)
          setAgentStates((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
              next[id] = { ...next[id], status: 'dead' };
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('EventSource error, will reconnect...');
    };

    return () => {
      eventSource.close();
    };
  }, [timelineMode]);

  // Clear build celebrations after 5 seconds
  useEffect(() => {
    Object.entries(agentStates).forEach(([id, state]) => {
      if (state.buildCelebration) {
        const timer = setTimeout(() => {
          setAgentStates((prev) => ({
            ...prev,
            [id]: { ...prev[id], buildCelebration: null },
          }));
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [agentStates]);

  // Handle handoff walking animations
  useEffect(() => {
    Object.entries(agentStates).forEach(([id, state]) => {
      if (state.handoff && state.handoff.from === id && !walkingAgents[id]) {
        setWalkingAgents((prev) => ({
          ...prev,
          [id]: { targetId: state.handoff!.to },
        }));

        // Clear after 3 seconds
        setTimeout(() => {
          setWalkingAgents((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 3000);
      }
    });
  }, [agentStates, walkingAgents]);

  // Save snapshots every 10 minutes
  useEffect(() => {
    const saveSnapshot = async () => {
      if (Object.keys(agentStates).length === 0) return;
      
      const snapshot = {
        agents: Object.fromEntries(
          Object.entries(agentStates).map(([id, state]) => [
            id,
            {
              status: state.status || 'idle',
              activity: state.activity,
              position: DESK_POSITIONS[id],
            },
          ])
        ),
      };

      try {
        await fetch('/api/company/floor-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });
      } catch (err) {
        console.error('Failed to save snapshot:', err);
      }
    };

    // Save snapshot every 10 minutes
    const interval = setInterval(saveSnapshot, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [agentStates]);

  // Meeting dialogue playback
  useEffect(() => {
    if (meetingMode && meetingLines.length > 0 && currentLineIdx < meetingLines.length) {
      const timer = setTimeout(() => {
        setCurrentLineIdx(i => i + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [meetingMode, meetingLines, currentLineIdx]);

  const loadTimeline = useCallback(async () => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    try {
      const res = await fetch(
        `/api/company/floor-history?from=${startOfDay}&to=${Date.now()}`
      );
      const data = await res.json();
      if (data.snapshots && data.snapshots.length > 0) {
        setTimelineSnapshots(data.snapshots);
        setTimelinePosition(data.snapshots[data.snapshots.length - 1].timestamp);
        setTimelineMode(true);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  }, []);

  const handleTimelineChange = useCallback((pos: number) => {
    setTimelinePosition(pos);

    // Find closest snapshot
    const closest = timelineSnapshots.reduce((prev, curr) =>
      Math.abs(curr.timestamp - pos) < Math.abs(prev.timestamp - pos)
        ? curr
        : prev
    );

    // Apply snapshot to agent states
    setAgentStates((prev) => {
      const next = { ...prev };
      Object.entries(closest.agents).forEach(([id, data]) => {
        next[id] = {
          ...prev[id],
          state: data.status === 'working' ? 'working' : 'idle',
          status: data.status,
          activity: data.activity,
        };
      });
      return next;
    });
  }, [timelineSnapshots]);

  const startMeeting = async () => {
    setMeetingMode(true);
    setCurrentLineIdx(0);

    // Update all agents to meeting
    setAgentStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], state: "meeting", activity: "In standup" };
      });
      return next;
    });

    // Load latest meeting transcript for dialogue
    try {
      const res = await fetch("/api/company/meetings");
      const data = await res.json();
      const meetings = data.meetings || [];
      if (meetings.length > 0) {
        const latest = meetings[0];
        const contentRes = await fetch(`/api/company/meetings/${latest.id}`);
        const contentData = await contentRes.json();
        const lines = parseMeetingDialogue(contentData.content || "");
        setMeetingLines(lines);
      }
    } catch {
      setMeetingLines([
        { speaker: "Q", emoji: "🦾", text: "Right, morning everyone. Quick round — what's happening?" },
        { speaker: "Spark", emoji: "🔥", text: "Shipped the latest feature. All tests passing." },
        { speaker: "Aura", emoji: "🎨", text: "Content calendar locked for this week." },
        { speaker: "Surge", emoji: "⚡", text: "Engagement up 12% — BTS content performing." },
        { speaker: "Q", emoji: "🦾", text: "Sick. Let's keep that momentum going." },
      ]);
    }
  };

  const endMeeting = () => {
    setMeetingMode(false);
    setMeetingLines([]);
    setCurrentLineIdx(0);
    setAgentStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const agentState = prev[id];
        const activity = agentState?.activity || ACTIVITIES[id]?.[0] || "Working...";
        next[id] = { ...next[id], state: "working", activity };
      });
      return next;
    });
  };

  const handleAgentClick = (e: React.MouseEvent, agentId: string) => {
    if (e.shiftKey) {
      // Toggle selection for chat
      setSelectedAgents(prev => {
        if (prev.includes(agentId)) {
          return prev.filter(id => id !== agentId);
        } else if (prev.length < 2) {
          return [...prev, agentId];
        }
        return prev;
      });
    } else {
      // Regular select
      setSelectedAgent(agentId);
      setSelectedAgents([]);
    }
  };

  const startAgentChat = async () => {
    if (selectedAgents.length !== 2) return;

    const agent1 = agents.find(a => a.id === selectedAgents[0]);
    const agent2 = agents.find(a => a.id === selectedAgents[1]);
    if (!agent1 || !agent2) return;

    setChatMessages([
      { agent: agent1.id, name: agent1.name, text: `Hey ${agent2.name}, what's on your mind?` },
      { agent: agent2.id, name: agent2.name, text: `Not much! ${agent1.name}, what are you working on?` },
    ]);

    try {
      const res = await fetch("/api/company/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent1: agent1.id, agent2: agent2.id }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.message) {
                setChatMessages(prev => [...prev, data.message]);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const visibleLines = meetingLines.slice(0, currentLineIdx);
  const currentSpeaker = currentLineIdx < meetingLines.length ? meetingLines[currentLineIdx]?.speaker : null;

  // Get agent positions for SVG overlays
  const getAgentPositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    agents.forEach(agent => {
      const deskPos = DESK_POSITIONS[agent.id];
      const meetPos = MEETING_GATHER[agent.id];
      if (!deskPos) return;

      const walkingTo = walkingAgents[agent.id];
      const targetPos = walkingTo ? DESK_POSITIONS[walkingTo.targetId] : null;
      
      const pos = meetingMode 
        ? (meetPos || deskPos) 
        : walkingTo && targetPos 
          ? { x: (deskPos.x + targetPos.x) / 2, y: (deskPos.y + targetPos.y) / 2 }
          : deskPos;
      
      positions[agent.id] = pos;
    });
    return positions;
  };

  const agentPositions = getAgentPositions();

  return (
    <>
      <style jsx global>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
        @keyframes breathe-active {
          0%, 100% { transform: scale(0.98); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(12px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.7; }
          25% { opacity: 0.3; }
          50% { opacity: 0.8; }
          75% { opacity: 0.4; }
        }
        @keyframes supernova {
          0% { transform: scale(1); }
          30% { transform: scale(2.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes handoff-travel {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
      `}</style>

      <div className="p-4 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              The Floor
            </h1>
            <p className="text-zinc-500 text-xs">{agents.length} agents • Villanueva Creative HQ • Live</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={meetingMode ? endMeeting : startMeeting}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${meetingMode ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              {meetingMode ? (
                <>
                  <XIcon size={16} />
                  End Meeting
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Start Meeting
                </>
              )}
            </button>
            <Link href="/company" className="text-xs text-blue-400 hover:underline">HQ →</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* The Energy Blob Office */}
          <div className="xl:col-span-2 relative rounded-xl overflow-hidden border-2 border-zinc-700" style={{ height: 640, background: "#0a0a1a" }}>
            {/* Cosmic starfield background */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 1px),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06) 1px, transparent 1px),
                radial-gradient(circle at 60% 20%, rgba(255,255,255,0.07) 1px, transparent 1px),
                radial-gradient(circle at 90% 40%, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px, 120px 120px, 100px 100px, 90px 90px, 70px 70px",
            }} />

            {/* Subtle grid overlay */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              opacity: 0.5,
            }} />

            {/* Wall - cosmic gradient */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-zinc-800/50 to-transparent backdrop-blur-sm border-b border-zinc-700/30" />

            {/* Meeting table - subtle ring of light */}
            <div className="absolute" style={{ left: 340, top: 445 }}>
              <div className={`w-[160px] h-[90px] rounded-[50%] border transition-all duration-500 ${meetingMode ? "border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.3)] bg-amber-500/5" : "border-zinc-600/30 bg-zinc-700/10"}`}>
                {/* Inner glow ring */}
                {meetingMode && (
                  <div className="absolute inset-0 rounded-[50%]" style={{
                    boxShadow: "inset 0 0 20px rgba(251,191,36,0.2)",
                  }} />
                )}
              </div>
            </div>

            {/* Energy Plants - subtle glowing orbs */}
            <EnergyPlant x={30} y={530} />
            <EnergyPlant x={800} y={530} />
            <EnergyPlant x={30} y={130} />
            <EnergyPlant x={800} y={130} />

            {/* SVG Overlay for connection lines and handoff arcs */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
              <defs>
                {agents.map(agent => {
                  const colors = AGENT_COLORS[agent.id];
                  if (!colors) return null;
                  return (
                    <radialGradient key={`grad-${agent.id}`} id={`grad-${agent.id}`}>
                      <stop offset="0%" stopColor={colors.body} stopOpacity="0.8" />
                      <stop offset="100%" stopColor={colors.body} stopOpacity="0" />
                    </radialGradient>
                  );
                })}
              </defs>

              {/* Meeting connection lines */}
              {meetingMode && agents.map((agent1, i) => {
                const pos1 = agentPositions[agent1.id];
                if (!pos1) return null;

                return agents.slice(i + 1).map(agent2 => {
                  const pos2 = agentPositions[agent2.id];
                  if (!pos2) return null;

                  // Calculate distance
                  const dx = pos1.x - pos2.x;
                  const dy = pos1.y - pos2.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Only connect if within 150px
                  if (distance > 150) return null;

                  return (
                    <line
                      key={`line-${agent1.id}-${agent2.id}`}
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={`url(#grad-${agent1.id})`}
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{
                        opacity: 0.4,
                        animation: "pulse-line 2s ease-in-out infinite",
                        mixBlendMode: "screen",
                      }}
                    />
                  );
                });
              })}

              {/* Handoff arcs */}
              {agents.map(agent => {
                const state = agentStates[agent.id];
                const handoff = state?.handoff;
                if (!handoff || handoff.from !== agent.id) return null;

                const fromPos = agentPositions[agent.id];
                const toPos = agentPositions[handoff.to];
                if (!fromPos || !toPos) return null;

                const fromColor = AGENT_COLORS[agent.id]?.body || "#888";
                const toColor = AGENT_COLORS[handoff.to]?.body || "#888";

                // Calculate control point for arc
                const midX = (fromPos.x + toPos.x) / 2;
                const midY = (fromPos.y + toPos.y) / 2 - 30;

                return (
                  <g key={`handoff-${agent.id}`}>
                    <defs>
                      <linearGradient id={`handoff-grad-${agent.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={fromColor} />
                        <stop offset="100%" stopColor={toColor} />
                      </linearGradient>
                    </defs>
                    {/* Arc path */}
                    <path
                      d={`M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`}
                      stroke={`url(#handoff-grad-${agent.id})`}
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        opacity: 0.7,
                        mixBlendMode: "screen",
                      }}
                    />
                    {/* Traveling dot */}
                    <circle
                      r="4"
                      fill={fromColor}
                      style={{
                        animation: "handoff-travel 1.5s ease-in-out infinite",
                        offsetPath: `path('M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}')`,
                        mixBlendMode: "screen",
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Agents */}
            {agents.map((agent) => {
              const deskPos = DESK_POSITIONS[agent.id];
              const meetPos = MEETING_GATHER[agent.id];
              if (!deskPos) return null;

              const walkingTo = walkingAgents[agent.id];
              const targetPos = walkingTo ? DESK_POSITIONS[walkingTo.targetId] : null;
              const pos = meetingMode 
                ? (meetPos || deskPos) 
                : walkingTo && targetPos 
                  ? { x: (deskPos.x + targetPos.x) / 2, y: (deskPos.y + targetPos.y) / 2 }
                  : deskPos;

              const colors = AGENT_COLORS[agent.id] || { body: "#888", accent: "#666", label: "#888" };
              const isSpeaking = meetingMode && currentSpeaker === agent.name;
              const isSelected = selectedAgent === agent.id;
              const isChatSelected = selectedAgents.includes(agent.id);
              const agentState = agentStates[agent.id];
              const isWorking = agentState?.status === 'working';
              const isErrored = agentState?.status === 'errored';
              const isDead = agentState?.status === 'dead';

              return (
                <div
                  key={agent.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: pos.x - 20,
                    top: pos.y - 20,
                    transition: "left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    zIndex: isSpeaking ? 30 : isChatSelected ? 28 : isSelected ? 25 : 15,
                  }}
                  onClick={(e) => handleAgentClick(e, agent.id)}
                >
                  {/* Build celebration - supernova effect */}
                  {agentState?.buildCelebration && (
                    <>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce">
                          ✅ {agentState.buildCelebration.buildName}
                        </div>
                      </div>
                      {/* Supernova particles */}
                      {[...Array(12)].map((_, i) => {
                        const angle = (i * 30) * Math.PI / 180;
                        const distance = 40;
                        return (
                          <div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full animate-ping"
                            style={{
                              left: `calc(50% + ${Math.cos(angle) * distance}px)`,
                              top: `calc(50% + ${Math.sin(angle) * distance}px)`,
                              background: colors.body,
                              animationDelay: `${i * 50}ms`,
                              animationDuration: "1s",
                            }}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* Handoff badge */}
                  {agentState?.handoff && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-40">
                      <div className="bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
                        📤 Handoff: {agentState.handoff.task.substring(0, 30)}...
                      </div>
                    </div>
                  )}

                  {/* Conversation snippet (speech bubble) */}
                  {agentState?.lastMessage && isWorking && !meetingMode && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
                      <div className="bg-zinc-800/90 border border-zinc-600/50 rounded-lg px-2 py-1 relative backdrop-blur-sm">
                        <p className="text-[9px] text-zinc-300 max-w-[200px] truncate">
                          {agentState.lastMessage}
                        </p>
                        {/* Speech bubble tail */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-600/50" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Speaking indicator (meeting) */}
                  {isSpeaking && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                      <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "100ms" }} />
                      <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "200ms" }} />
                    </div>
                  )}

                  {/* Energy Blob */}
                  <EnergyBlob
                    color={colors.body}
                    state={isDead ? 'dead' : isErrored ? 'errored' : isWorking ? 'working' : 'idle'}
                    isSpeaking={isSpeaking}
                    isCelebrating={!!agentState?.buildCelebration}
                    isSelected={isSelected || isChatSelected}
                  />

                  {/* Name label */}
                  <div className="text-center mt-2">
                    <span className="text-[10px] font-bold" style={{ color: colors.label, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                      {agent.name}
                    </span>
                  </div>

                  {/* Activity bubble (when at desk and selected) */}
                  {!meetingMode && (isSelected || isChatSelected) && agentState && !agentState.lastMessage && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
                      <div className="bg-zinc-800/90 border border-zinc-600/50 rounded px-2 py-1 backdrop-blur-sm">
                        <p className="text-[9px] text-zinc-300">{agentState.activity}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Timeline scrubber */}
            {timelineMode && timelineSnapshots.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 bg-zinc-800/90 rounded-lg p-3 border border-zinc-600/50 z-50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setTimelineMode(false)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Exit Replay
                  </button>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(timelinePosition).toLocaleTimeString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={timelineSnapshots[0]?.timestamp || 0}
                  max={timelineSnapshots[timelineSnapshots.length - 1]?.timestamp || Date.now()}
                  value={timelinePosition}
                  onChange={(e) => handleTimelineChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Timeline button (when not in timeline mode) */}
            {!timelineMode && !meetingMode && (
              <button
                onClick={loadTimeline}
                className="absolute bottom-4 right-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded z-50"
              >
                📊 Timeline
              </button>
            )}

            {/* Room label */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                {meetingMode ? <><Calendar size={10} /> Standup In Progress</> : timelineMode ? "⏮️ Replay Mode" : "Villanueva Creative HQ"}
              </span>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            {/* Meeting chat / Agent chat */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 flex flex-col" style={{ height: meetingMode ? 420 : 420 }}>
              <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  {meetingMode ? (
                    <><Calendar size={14} /> Standup Chat</>
                  ) : chatMessages.length > 0 ? (
                    <><MessageSquare size={14} /> Agent Conversation</>
                  ) : (
                    <><MessageSquare size={14} /> Office Chat</>
                  )}
                </h3>
                {selectedAgents.length === 2 && !meetingMode && (
                  <button
                    onClick={startAgentChat}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    Start Chat
                  </button>
                )}
                {meetingMode && (
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {meetingMode && visibleLines.length > 0 ? (
                  visibleLines.map((line, i) => {
                    const colors = AGENT_COLORS[Object.keys(AGENT_COLORS).find(k => {
                      const roster = agents.find(a => a.id === k);
                      return roster?.name === line.speaker;
                    }) || ""] || { label: "#888" };
                    return (
                      <div key={i} className="animate-fade-in">
                        <span className="text-xs font-bold" style={{ color: colors.label }}>{line.speaker}:</span>
                        <span className="text-xs text-zinc-300 ml-1">{line.text}</span>
                      </div>
                    );
                  })
                ) : chatMessages.length > 0 && !meetingMode ? (
                  chatMessages.map((msg, i) => {
                    const colors = AGENT_COLORS[msg.agent] || { label: "#888" };
                    const agent = agents.find(a => a.id === msg.agent);
                    return (
                      <div key={i} className="animate-fade-in">
                        <span className="text-xs font-bold" style={{ color: colors.label }}>{agent?.name || msg.name}:</span>
                        <span className="text-xs text-zinc-300 ml-1">{msg.text}</span>
                      </div>
                    );
                  })
                ) : selectedAgents.length === 1 && !meetingMode ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-zinc-600 text-center">
                      Shift+click another agent to start a chat
                    </p>
                  </div>
                ) : selectedAgents.length === 2 && !meetingMode ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-zinc-600 text-center flex items-center gap-1 justify-center">
                      Click <MessageSquare size={10} /> Start Chat above to begin conversation
                    </p>
                  </div>
                ) : !meetingMode ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-zinc-600 text-center">
                      Shift+click two agents to start a chat<br/>or &quot;Start Meeting&quot; for standup
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-zinc-500">Loading meeting transcript...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Agent info */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4">
              {selectedAgent && agents.find(a => a.id === selectedAgent) ? (() => {
                const agent = agents.find(a => a.id === selectedAgent)!;
                const colors = AGENT_COLORS[agent.id] || { body: "#888", label: "#888" };
                const agentState = agentStates[agent.id];
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${colors.body}, ${colors.accent})`, boxShadow: `0 0 12px ${colors.body}` }} />
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: colors.label }}>{agent.name}</h4>
                        <p className="text-[10px] text-zinc-500">{agent.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400">{agent.personality}</p>
                    <p className="text-[10px] text-zinc-600">Model: {agent.model.primary.split("/").pop()}</p>
                    {/* Token counter */}
                    {agentState && agentState.tokens && agentState.tokens > 0 && (
                      <div className="text-[10px] text-green-400">
                        {agentState.tokens.toLocaleString()} tokens
                      </div>
                    )}
                    <Link href={`/company/agents/${agent.id}`} className="text-[10px] text-blue-400 hover:underline block">Full profile →</Link>
                  </div>
                );
              })() : (
                <p className="text-xs text-zinc-600 text-center py-4">Click an agent to inspect</p>
              )}
            </div>

            {/* Status Legend */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-3">
              <h4 className="text-xs font-bold text-zinc-300 mb-2">Status Legend</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">Idle (&gt;10min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-[10px] text-zinc-400">Offline</span>
                </div>
              </div>
            </div>

            {/* Agent Color Legend */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-3">
              <div className="grid grid-cols-3 gap-1">
                {agents.slice(0, 12).map(a => {
                  const colors = AGENT_COLORS[a.id] || { label: "#888" };
                  return (
                    <div key={a.id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.label, boxShadow: `0 0 4px ${colors.label}` }} />
                      <span className="text-[9px]" style={{ color: colors.label }}>{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Energy Blob Component
function EnergyBlob({
  color,
  state,
  isSpeaking,
  isCelebrating,
  isSelected,
}: {
  color: string;
  state: 'idle' | 'working' | 'errored' | 'dead';
  isSpeaking: boolean;
  isCelebrating: boolean;
  isSelected: boolean;
}) {
  const getAnimation = () => {
    if (state === 'dead') return undefined;
    if (state === 'errored') return 'flicker 0.15s infinite';
    if (state === 'working' || isSpeaking) return 'breathe-active 1.5s ease-in-out infinite';
    return 'breathe 3s ease-in-out infinite';
  };

  const getOpacity = () => {
    if (state === 'dead') return 0.15;
    if (state === 'working' || isSpeaking) return 1;
    if (state === 'errored') return 0.8;
    return 0.85;
  };

  const getTransform = () => {
    if (isCelebrating) return 'supernova 0.8s ease-out';
    if (isSpeaking) return 'scale(1.2)';
    return undefined;
  };

  const getGlowBlur = () => {
    if (state === 'dead') return 0;
    if (state === 'working' || isSpeaking) return 20;
    if (state === 'errored') return 8;
    return 12;
  };

  const getGlowOpacity = () => {
    if (state === 'dead') return 0;
    if (state === 'working' || isSpeaking) return 0.8;
    if (state === 'errored') return 0.5;
    return 0.6;
  };

  return (
    <div
      className="relative flex items-center justify-center"
    >
      {/* Outer glow layer */}
      {state !== 'dead' && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: `blur(${getGlowBlur()}px)`,
            opacity: getGlowOpacity(),
            animation: state === 'errored' ? 'flicker 0.15s infinite' : 'breathe 2s ease-in-out infinite',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Base orb */}
      <div
        className="rounded-full relative"
        style={{
          width: '40px',
          height: '40px',
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
          animation: getAnimation(),
          transform: getTransform(),
          opacity: getOpacity(),
          mixBlendMode: 'screen',
        }}
      >
        {/* Inner particles - orbiting dots */}
        {state !== 'dead' && (
          <>
            <div
              className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-80"
              style={{
                left: '50%',
                top: '50%',
                animation: 'orbit 2s linear infinite',
                mixBlendMode: 'screen',
              }}
            />
            <div
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: '50%',
                top: '50%',
                animation: 'orbit 3s linear infinite',
                animationDelay: '-0.66s',
                mixBlendMode: 'screen',
              }}
            />
            <div
              className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-70"
              style={{
                left: '50%',
                top: '50%',
                animation: 'orbit 2.5s linear infinite',
                animationDelay: '-1.33s',
                mixBlendMode: 'screen',
              }}
            />
            <div
              className="absolute w-1 h-1 bg-white rounded-full opacity-50"
              style={{
                left: '50%',
                top: '50%',
                animation: 'orbit 3.5s linear infinite',
                animationDelay: '-2s',
                mixBlendMode: 'screen',
              }}
            />
          </>
        )}

        {/* Reddish tinge for errored state */}
        {state === 'errored' && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 30%, rgba(239, 68, 68, 0.4) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
        )}

        {/* Selection highlight */}
        {isSelected && (
          <div
            className="absolute -inset-2 rounded-full animate-pulse"
            style={{
              border: `2px solid ${color}`,
              boxShadow: `0 0 15px ${color}`,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>
    </div>
  );
}

// Energy Plant - subtle glowing orb
function EnergyPlant({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      <div
        className="w-6 h-6 rounded-full relative"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #4ade80, #22c55e66)',
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)',
          animation: 'breathe 4s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      >
        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(74, 222, 128, 0.3) 100%)',
          }}
        />
      </div>
    </div>
  );
}

function parseMeetingDialogue(content: string): MeetingLine[] {
  const lines: MeetingLine[] = [];
  const agentEmojis: Record<string, string> = {
    Q: "🦾", Aura: "🎨", Surge: "⚡", Spark: "🔥", Cipher: "🔮",
    Volt: "🏹", Echo: "💬", Flux: "🌊", Prism: "💎", Luna: "🌙",
    Ella: "👩‍🎨", Arty: "🏹",
  };

  for (const line of content.split("\n")) {
    // Match **Name Emoji:** text
    const match = line.match(/\*\*([^*]+?)(?:\s+[^\w\s])?\*\*:\s*(.+)/);
    if (match) {
      const speaker = match[1].trim().split(" ")[0]; // First word = name
      const text = match[2].trim();
      if (text && speaker) {
        lines.push({
          speaker,
          emoji: agentEmojis[speaker] || "💬",
          text,
        });
      }
    }
  }
  return lines;
}
