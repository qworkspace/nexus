"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

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

type AgentState = "working" | "meeting" | "idle" | "walking";

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
  const [agentStates, setAgentStates] = useState<Record<string, { state: AgentState; activity: string; bobPhase: number; lastActive: string }>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]); // For chat
  const [chatMessages, setChatMessages] = useState<Array<{ agent: string; name: string; text: string }>>([]);
  const agentsRef = useRef<Agent[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    // Load roster once
    const loadRoster = async () => {
      try {
        const res = await fetch("/api/company/roster");
        const data = await res.json();
        const agts: Agent[] = data.agents || [];
        setAgents(agts);

        // Set initial states
        const statusRes = await fetch("/api/company/agent-status");
        const statusData = await statusRes.json();

        const states: Record<string, { state: AgentState; activity: string; bobPhase: number; lastActive: string }> = {};
        agts.forEach((a) => {
          const agentData = statusData.agents?.[a.id];
          const state: AgentState = agentData?.state === "meeting" ? "meeting" : agentData?.state === "working" ? "working" : "idle";
          states[a.id] = {
            state,
            activity: agentData?.activity || ACTIVITIES[a.id]?.[0] || "Working...",
            bobPhase: 0,
            lastActive: agentData?.lastActive || new Date().toISOString(),
          };
        });
        setAgentStates(states);
      } catch (err) {
        console.error("Failed to load agent status:", err);
      }
    };

    loadRoster();

    // Poll agent status every 10 seconds
    const pollAgentStatus = async () => {
      try {
        const res = await fetch("/api/company/agent-status");
        const data = await res.json();

        setAgentStates(prev => {
          const next = { ...prev };
          agentsRef.current.forEach((a) => {
            const agentData = data.agents?.[a.id];
            const state: AgentState = agentData?.state === "meeting" ? "meeting" : agentData?.state === "working" ? "working" : "idle";
            next[a.id] = {
              ...prev[a.id],
              state,
              activity: agentData?.activity || prev[a.id]?.activity || ACTIVITIES[a.id]?.[0] || "Working...",
              lastActive: agentData?.lastActive || prev[a.id]?.lastActive || new Date().toISOString(),
            };
          });
          return next;
        });
      } catch (err) {
        console.error("Failed to poll agent status:", err);
      }
    };

    const interval = setInterval(pollAgentStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Meeting dialogue playback
  useEffect(() => {
    if (meetingMode && meetingLines.length > 0 && currentLineIdx < meetingLines.length) {
      const timer = setTimeout(() => {
        setCurrentLineIdx(i => i + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [meetingMode, meetingLines, currentLineIdx]);

  const startMeeting = async () => {
    setMeetingMode(true);
    setCurrentLineIdx(0);

    // Update all agents to walking then meeting
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
        { speaker: "Forge", emoji: "💻", text: "Shipped the latest feature. All tests passing." },
        { speaker: "Muse", emoji: "🎨", text: "Content calendar locked for this week." },
        { speaker: "Vector", emoji: "📈", text: "Engagement up 12% — BTS content performing." },
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

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">🏠 The Floor</h1>
          <p className="text-zinc-500 text-xs">{agents.length} agents • Villanueva Creative HQ</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={meetingMode ? endMeeting : startMeeting}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${meetingMode ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {meetingMode ? "✕ End Meeting" : "📋 Start Meeting"}
          </button>
          <Link href="/company" className="text-xs text-blue-400 hover:underline">HQ →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* The Pixel Art Office */}
        <div className="xl:col-span-2 relative rounded-xl overflow-hidden border-2 border-zinc-700" style={{ height: 640, background: "#1a1a2e" }}>
          {/* Checkered floor */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(45deg, #16162a 25%, transparent 25%), linear-gradient(-45deg, #16162a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #16162a 75%), linear-gradient(-45deg, transparent 75%, #16162a 75%)",
            backgroundSize: "40px 40px",
            backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
            opacity: 0.3,
          }} />

          {/* Wall */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-zinc-700 to-zinc-800 border-b-4 border-zinc-600" />

          {/* Desks (when not in meeting) */}
          {!meetingMode && Object.entries(DESK_POSITIONS).map(([id, pos]) => (
            <div key={`desk-${id}`} className="absolute" style={{ left: pos.x - 30, top: pos.y - 20 }}>
              {/* Monitor */}
              <div className="w-[28px] h-[22px] mx-auto bg-blue-500 rounded-sm border-2 border-blue-400 shadow-lg shadow-blue-500/30" />
              {/* Monitor stand */}
              <div className="w-[8px] h-[6px] mx-auto bg-zinc-500" />
              {/* Desk */}
              <div className="w-[60px] h-[10px] bg-zinc-500 rounded-sm border border-zinc-400" />
              {/* Desk legs */}
              <div className="flex justify-between px-1">
                <div className="w-[4px] h-[8px] bg-zinc-600" />
                <div className="w-[4px] h-[8px] bg-zinc-600" />
              </div>
            </div>
          ))}

          {/* Meeting table (always visible, glows during meeting) */}
          <div className="absolute" style={{ left: 340, top: 445 }}>
            <div className={`w-[160px] h-[90px] rounded-[50%] border-4 transition-all duration-500 ${meetingMode ? "bg-zinc-600 border-zinc-400 shadow-xl shadow-amber-500/20" : "bg-zinc-700/50 border-zinc-600/50"}`}>
              {/* Chairs */}
              {meetingMode && [0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <div
                  key={angle}
                  className="absolute w-[14px] h-[14px] rounded-full bg-zinc-500 border border-zinc-400"
                  style={{
                    left: `${50 + 55 * Math.cos(angle * Math.PI / 180)}%`,
                    top: `${50 + 55 * Math.sin(angle * Math.PI / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Plants */}
          <PixelPlant x={30} y={530} />
          <PixelPlant x={800} y={530} />
          <PixelPlant x={30} y={130} />
          <PixelPlant x={800} y={130} />

          {/* Water cooler */}
          <div className="absolute" style={{ left: 40, top: 320 }}>
            <div className="w-[16px] h-[24px] bg-sky-300 rounded-t-lg border border-sky-200 mx-auto" />
            <div className="w-[20px] h-[16px] bg-zinc-400 rounded-sm border border-zinc-300" />
            <div className="text-[8px] text-sky-400 text-center mt-0.5">💧</div>
          </div>

          {/* Agents */}
          {agents.map((agent) => {
            const deskPos = DESK_POSITIONS[agent.id];
            const meetPos = MEETING_GATHER[agent.id];
            if (!deskPos) return null;

            const pos = meetingMode ? (meetPos || deskPos) : deskPos;
            const colors = AGENT_COLORS[agent.id] || { body: "#888", accent: "#666", label: "#888" };
            const isSpeaking = meetingMode && currentSpeaker === agent.name;
            const bobOffset = Math.sin((tick + (agentStates[agent.id]?.bobPhase || 0)) * 0.8) * 2;
            const isSelected = selectedAgent === agent.id;
            const isChatSelected = selectedAgents.includes(agent.id);
            const agentState = agentStates[agent.id];
            const isWorking = agentState?.state === "working" || agentState?.state === "meeting";

            return (
              <div
                key={agent.id}
                className="absolute cursor-pointer"
                style={{
                  left: pos.x - 16,
                  top: (pos.y + 20) + bobOffset,
                  transition: "left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: isSpeaking ? 30 : isChatSelected ? 28 : isSelected ? 25 : 15,
                }}
                onClick={(e) => handleAgentClick(e, agent.id)}
              >
                {/* Speaking indicator */}
                {isSpeaking && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "100ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "200ms" }} />
                  </div>
                )}

                {/* Selection glow */}
                {(isSelected || isChatSelected) && (
                  <div className="absolute -inset-2 rounded-full animate-pulse" style={{ background: `${colors.body}33` }} />
                )}

                {/* Active indicator (green dot) */}
                {!meetingMode && isWorking && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-800 animate-pulse" />
                )}

                {/* Idle indicator (grey dot) */}
                {!meetingMode && !isWorking && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-zinc-500 border-2 border-zinc-800" />
                )}

                {/* Chat selection indicator */}
                {isChatSelected && (
                  <div className="absolute -top-3 -left-1 text-[12px]">
                    {selectedAgents.indexOf(agent.id) + 1}
                  </div>
                )}

                {/* Pixel character */}
                <div className="flex flex-col items-center">
                  {/* Head */}
                  <div className="w-[14px] h-[14px] rounded-sm" style={{ background: colors.body, boxShadow: `0 0 ${isSpeaking ? '8' : '3'}px ${colors.body}` }} />
                  {/* Body */}
                  <div className="w-[18px] h-[12px] rounded-sm -mt-[1px]" style={{ background: colors.accent }} />
                  {/* Legs */}
                  <div className="flex gap-[3px] -mt-[1px]">
                    <div className="w-[6px] h-[6px] rounded-sm" style={{ background: colors.accent, opacity: tick % 2 === 0 && meetingMode ? 0.7 : 1 }} />
                    <div className="w-[6px] h-[6px] rounded-sm" style={{ background: colors.accent, opacity: tick % 2 !== 0 && meetingMode ? 0.7 : 1 }} />
                  </div>
                </div>

                {/* Name label */}
                <div className="text-center mt-1">
                  <span className="text-[10px] font-bold" style={{ color: colors.label, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                    {agent.name}
                  </span>
                </div>

                {/* Activity bubble (when at desk) */}
                {!meetingMode && (isSelected || isChatSelected) && agentState && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1">
                      <p className="text-[9px] text-zinc-300">{agentState.activity}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Room label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {meetingMode ? "📋 Standup In Progress" : "Villanueva Creative HQ"}
            </span>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Meeting chat / Agent chat */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 flex flex-col" style={{ height: meetingMode ? 420 : 420 }}>
            <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                {meetingMode ? "📋 Standup Chat" : chatMessages.length > 0 ? "💬 Agent Conversation" : "💬 Office Chat"}
              </h3>
              {selectedAgents.length === 2 && !meetingMode && (
                <button
                  onClick={startAgentChat}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                >
                  💬 Start Chat
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
                  <p className="text-xs text-zinc-600 text-center">
                    Click &quot;💬 Start Chat&quot; above to begin conversation
                  </p>
                </div>
              ) : !meetingMode ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-zinc-600 text-center">
                    Shift+click two agents to start a chat<br/>or &quot;Start Meeting&quot; for standup 📋
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
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded" style={{ background: colors.body, boxShadow: `0 0 8px ${colors.body}` }} />
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: colors.label }}>{agent.name}</h4>
                      <p className="text-[10px] text-zinc-500">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">{agent.personality}</p>
                  <p className="text-[10px] text-zinc-600">Model: {agent.model.primary.split("/").pop()}</p>
                  <Link href={`/company/agents/${agent.id}`} className="text-[10px] text-blue-400 hover:underline block">Full profile →</Link>
                </div>
              );
            })() : (
              <p className="text-xs text-zinc-600 text-center py-4">Click an agent to inspect</p>
            )}
          </div>

          {/* Legend */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-3">
            <div className="grid grid-cols-3 gap-1">
              {agents.slice(0, 12).map(a => {
                const colors = AGENT_COLORS[a.id] || { label: "#888" };
                return (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ background: colors.label }} />
                    <span className="text-[9px]" style={{ color: colors.label }}>{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseMeetingDialogue(content: string): MeetingLine[] {
  const lines: MeetingLine[] = [];
  const agentEmojis: Record<string, string> = {
    Q: "🦾", Muse: "🎨", Vector: "📈", Forge: "💻", Atlas: "🔬",
    Volt: "🎪", Echo: "💬", Probe: "🧪", Pixel: "✏️", Luna: "🌙",
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

function PixelPlant({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {/* Leaves */}
      <div className="w-[24px] h-[20px] bg-green-600 rounded-full mx-auto border border-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.3)" }} />
      {/* Trunk */}
      <div className="w-[6px] h-[8px] bg-amber-800 mx-auto -mt-[2px]" />
      {/* Pot */}
      <div className="w-[20px] h-[12px] bg-amber-700 rounded-b-lg mx-auto border border-amber-600" />
    </div>
  );
}
