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

interface AgentPosition {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  zone: string;
}

interface Collaboration {
  from: string;
  to: string;
  task: string;
  intensity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  zone?: string; // Zone-specific particles
}

interface WaterParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface EnergyBeam {
  from: string;
  to: string;
  startTime: number;
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DemoChatMessage {
  from: string;
  to: string;
  text: string;
}

interface TypingIndicator {
  agentId: string | null;
  targetAgentId: string | null;
  startTime: number;
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
};

function generateDemoMessage(agentId: string, activities: string[]): string {
  const messages: Record<string, string[]> = {
    main: [
      "Coordinating the sprint",
      "Checking overnight builds",
      "Reviewing pipeline status",
      "Syncing with team leads",
    ],
    creative: [
      "Drafting the campaign brief",
      "Reviewing brand guidelines",
      "Polishing the creative deck",
      "Aligning with Ella's vision",
    ],
    design: [
      "Updating the design system",
      "Creating new components",
      "Polishing the UI flow",
      "Reviewing accessibility",
    ],
    growth: [
      "Analysing funnel data",
      "A/B test results look good",
      "Engagement metrics rising",
      "Content performance review",
    ],
    research: [
      "Deep dive on AI trends",
      "Market intel gathering",
      "Competitor analysis",
      "Tech radar scanning",
    ],
    dev: [
      "Shipping the feature",
      "Code review in progress",
      "Fixing edge cases",
      "Refactoring for clarity",
    ],
    testing: [
      "Running test suite",
      "Found an edge case",
      "QA pass complete",
      "Regression testing",
    ],
    events: [
      "Coordinating with venue",
      "Lineup finalization",
      "Promo schedule set",
      "Logistics confirmed",
    ],
    support: [
      "Resolving tickets",
      "Updating documentation",
      "User feedback analysis",
      "Knowledge base refresh",
    ],
  };

  const agentMessages = messages[agentId] || activities;
  return agentMessages[Math.floor(Math.random() * agentMessages.length)];
}

// Zone centers (targets for agents to drift toward)
const ZONE_CENTERS: Record<string, { x: number; y: number }> = {
  forge:   { x: 150, y: 400 },  // Building zone (bottom-left)
  stream:  { x: 650, y: 150 },  // Research zone (top-right)
  pulse:   { x: 650, y: 450 },  // Comms zone (bottom-right)
  void:    { x: 150, y: 150 },  // Idle zone (top-left)
};

// Jitter radius per zone (40-60px for zone spread)
const ZONE_JITTER: Record<string, number> = {
  forge: 50,
  stream: 50,
  pulse: 50,
  void: 50,
};

// War Room convergence (meeting mode)
const WAR_ROOM_CENTER = { x: 410, y: 320 };

// Zone colors for background glow
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ZONE_COLORS = {
  forge:   { bg: 'rgba(251, 146, 60, 0.08)', glow: 'rgba(251, 146, 60, 0.3)' },
  stream:  { bg: 'rgba(59, 130, 246, 0.08)', glow: 'rgba(59, 130, 246, 0.3)' },
  pulse:   { bg: 'rgba(34, 197, 94, 0.08)', glow: 'rgba(34, 197, 94, 0.3)' },
  void:    { bg: 'rgba(39, 39, 42, 0.3)',  glow: 'rgba(113, 113, 122, 0.2)' },
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
};

// Agent display names for chat (map from agent ID to display name)
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  main: 'Q',
  research: 'Cipher',
  creative: 'Aura',
  dev: 'Spark',
  testing: 'Flux',
  growth: 'Surge',
  events: 'Volt',
  support: 'Echo',
  design: 'Prism',
};

// Demo chat messages for Office Chat simulation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEMO_CHAT_MESSAGES = [
  { from: 'main', to: 'all', text: "Morning team. Cipher, how's the research queue looking?" },
  { from: 'research', to: 'main', text: 'Got 3 specs ready for review. Prioritising the auth layer one.' },
  { from: 'main', to: 'creative', text: 'Spark, pick up the content pipeline spec when you\'re free.' },
  { from: 'creative', to: 'main', text: 'On it. Pulling the spec now.' },
  { from: 'testing', to: 'creative', text: 'Last build had a failing test in the API routes. Check line 42.' },
  { from: 'creative', to: 'testing', text: 'Good catch. Fixing now.' },
  { from: 'design', to: 'main', text: 'New brand assets ready for review. Uploaded to /creative/assets.' },
  { from: 'growth', to: 'main', text: 'Engagement up 23% this week. Newsletter performing well.' },
  { from: 'support', to: 'main', text: 'Customer asked about API rate limits. Drafted a KB article.' },
  { from: 'events', to: 'main', text: 'Next event venue confirmed. Sending logistics brief.' },
  { from: 'main', to: 'all', text: 'Nice work team. Flux, run QA on Spark\'s latest commit.' },
  { from: 'testing', to: 'main', text: 'QA passed. All tests green. Ready to ship.' },
  { from: 'design', to: 'design', text: 'Updated the component library. New button variants ready.' },
  { from: 'support', to: 'main', text: 'Heads up — got a handoff request from Discord. Routing to Echo.' },
];

// Initial agent zone assignments for demo mode to ensure spread across zones
const DEMO_AGENT_ZONES: Record<string, string> = {
  main: 'pulse',      // Q - center orchestrator, starts in pulse for comms
  creative: 'forge',  // Spark - building
  testing: 'forge',   // Flux - building
  research: 'stream', // Cipher - research
  design: 'pulse',    // Aura - comms
  growth: 'pulse',    // Surge - comms
  events: 'stream',   // Volt - planning
  support: 'void',    // Echo - idle/support
};

function assignAgentToZone(agentId: string, activity: string, status: string): string {
  // Dead/idle agents go to The Void
  if (status === 'dead' || status === 'idle') {
    return 'void';
  }

  // Check activity keywords for zone assignment
  const lowerActivity = activity.toLowerCase();

  // The Forge: building, coding, shipping
  if (
    lowerActivity.includes('build') ||
    lowerActivity.includes('code') ||
    lowerActivity.includes('ship') ||
    lowerActivity.includes('deploy') ||
    lowerActivity.includes('feature') ||
    lowerActivity.includes('fix') ||
    lowerActivity.includes('implement')
  ) {
    return 'forge';
  }

  // The Stream: research, analysis, intel, trends
  if (
    lowerActivity.includes('research') ||
    lowerActivity.includes('analy') ||
    lowerActivity.includes('intel') ||
    lowerActivity.includes('trend') ||
    lowerActivity.includes('investigate') ||
    lowerActivity.includes('explore') ||
    lowerActivity.includes('market')
  ) {
    return 'stream';
  }

  // The Pulse: communication, chat, message, handoff
  if (
    lowerActivity.includes('chat') ||
    lowerActivity.includes('message') ||
    lowerActivity.includes('handoff') ||
    lowerActivity.includes('communicat') ||
    lowerActivity.includes('discuss') ||
    lowerActivity.includes('standup') ||
    lowerActivity.includes('meeting')
  ) {
    return 'pulse';
  }

  // Default to void if uncertain
  return 'void';
}

// Helper functions for quadratic bezier interpolation
function quadraticBezierPoint(
  x0: number, y0: number,
  cx: number, cy: number,
  x1: number, y1: number,
  t: number,
  axis: 'x' | 'y' = 'x'
): number {
  const mt = 1 - t;
  if (axis === 'x') {
    return mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
  } else {
    return mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
  }
}

// Helper to get bezier x coordinate
function bezierX(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, t: number): number {
  return quadraticBezierPoint(x0, y0, cx, cy, x1, y1, t, 'x');
}

// Helper to get bezier y coordinate
function bezierY(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, t: number): number {
  return quadraticBezierPoint(x0, y0, cx, cy, x1, y1, t, 'y');
}

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
  const [agentPositions, setAgentPositions] = useState<Record<string, AgentPosition>>({});
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waterfallParticles, setWaterfallParticles] = useState<WaterParticle[]>([]);
  const [particleCount, setParticleCount] = useState(50);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [handoffMessages, setHandoffMessages] = useState<Array<{ from: string; to: string; task: string; time: string }>>([]);
  const [energyBeams, setEnergyBeams] = useState<EnergyBeam[]>([]);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ agentId: null, targetAgentId: null, startTime: 0 });
  const [demoChatIndex, setDemoChatIndex] = useState(0);

  // Demo mode state
  const [demoMode, setDemoMode] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1); // 0.5, 1 (removed 2x)
  const [demoIntensity, setDemoIntensity] = useState<'calm' | 'normal' | 'busy'>('normal');
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const arcCanvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Load handoff messages from API
  useEffect(() => {
    const loadHandoffs = async () => {
      try {
        const res = await fetch('/api/company/handoffs');
        const data = await res.json();
        setHandoffMessages(data.handoffs || []);
      } catch (err) {
        console.error('Failed to load handoffs:', err);
      }
    };

    loadHandoffs();

    // Refresh every 30 seconds
    const interval = setInterval(loadHandoffs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load roster once
  useEffect(() => {
    const loadRoster = async () => {
      try {
        const res = await fetch("/api/company/roster");
        const data = await res.json();
        const agts: Agent[] = (data.agents || []).filter((a: Agent) => !['ella', 'arty', 'larina', 'luna'].includes(a.id));
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

        // Initialize agent positions with proper zone jitter
        const positions: Record<string, AgentPosition> = {};
        agts.forEach((agent) => {
          const zone = assignAgentToZone(
            agent.id,
            ACTIVITIES[agent.id]?.[0] || 'Idle',
            'idle'
          );
          const center = ZONE_CENTERS[zone];
          const jitter = ZONE_JITTER[zone as keyof typeof ZONE_JITTER] || 40;

          // Start with jittered offset from zone center (40-60px radius)
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * jitter;

          positions[agent.id] = {
            currentX: center.x + Math.cos(angle) * radius,
            currentY: center.y + Math.sin(angle) * radius,
            targetX: center.x + Math.cos(angle) * radius,
            targetY: center.y + Math.sin(angle) * radius,
            zone,
          };
        });
        setAgentPositions(positions);

        // Initialize ambient particles (zone-specific)
        const ps: Particle[] = [];
        const zones = ['forge', 'stream', 'pulse', 'void'];
        const particlesPerZone = 25;

        zones.forEach((zoneName) => {
          const center = ZONE_CENTERS[zoneName];

          for (let i = 0; i < particlesPerZone; i++) {
            // Start particles within zone radius
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 100; // 100px radius around zone center

            ps.push({
              x: center.x + Math.cos(angle) * radius,
              y: center.y + Math.sin(angle) * radius,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (Math.random() - 0.5) * 0.2,
              size: Math.random() * 2 + 1,
              opacity: Math.random() * 0.4 + 0.1,
              zone: zoneName,
            });
          }
        });
        setParticles(ps);

        // Initialize waterfall particles
        const waterParticles: WaterParticle[] = [];
        for (let i = 0; i < 30; i++) {
          waterParticles.push({
            x: 20 + Math.random() * 30,
            y: Math.random() * 400 + 100,
            speed: Math.random() * 1.5 + 0.5,
            size: Math.random() * 2 + 1,
          });
        }
        setWaterfallParticles(waterParticles);
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

  // Update agent positions with smooth drift animation (SLOWER: 0.02 speed)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentPositions((prev) => {
        const next: Record<string, AgentPosition> = { ...prev };

        agentsRef.current.forEach((agent) => {
          const agentState = agentStates[agent.id];
          const zone = assignAgentToZone(
            agent.id,
            agentState?.activity || 'Idle',
            agentState?.status || 'idle'
          );

          const pos = prev[agent.id];
          if (!pos) return;

          // Meeting mode: all agents converge to War Room
          if (meetingMode) {
            next[agent.id] = {
              ...pos,
              targetX: WAR_ROOM_CENTER.x,
              targetY: WAR_ROOM_CENTER.y,
              zone: 'warroom',
            };
          }

          // Zone changed? Update target with jitter
          else if (pos.zone !== zone) {
            const center = ZONE_CENTERS[zone];
            const jitter = ZONE_JITTER[zone as keyof typeof ZONE_JITTER] || 40;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * jitter;

            next[agent.id] = {
              ...pos,
              targetX: center.x + Math.cos(angle) * radius,
              targetY: center.y + Math.sin(angle) * radius,
              zone,
            };
            return next;
          }

          // Meeting mode: converge to center
          if (meetingMode) {
            const dx = pos.targetX - pos.currentX;
            const dy = pos.targetY - pos.currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
              const speed = 0.02; // Slower movement
              next[agent.id] = {
                ...pos,
                currentX: pos.currentX + dx * speed,
                currentY: pos.currentY + dy * speed,
              };
            }
            return next;
          }

          // Idle agents in Void: subtle bobbing animation
          if (zone === 'void' && agentState?.status === 'idle') {
            const time = Date.now() / 1000;
            next[agent.id] = {
              ...pos,
              currentX: pos.targetX + Math.sin(time * 0.5) * 3,
              currentY: pos.targetY + Math.cos(time * 0.4) * 2,
            };
            return next;
          }

          // Interpolate toward target (smooth drift) - SLOWER
          const dx = pos.targetX - pos.currentX;
          const dy = pos.targetY - pos.currentY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 1) {
            const speed = 0.02; // Slower movement (was 0.05)
            next[agent.id] = {
              ...pos,
              currentX: pos.currentX + dx * speed,
              currentY: pos.currentY + dy * speed,
            };
          } else {
            // Near target: add subtle bobbing while stationary
            const time = Date.now() / 1000;
            const jitter = ZONE_JITTER[zone as keyof typeof ZONE_JITTER] || 40;
            next[agent.id] = {
              ...pos,
              currentX: pos.targetX + Math.sin(time * 0.3 + agent.id.charCodeAt(0)) * (jitter * 0.1),
              currentY: pos.targetY + Math.cos(time * 0.25 + agent.id.charCodeAt(1)) * (jitter * 0.1),
            };
          }
        });

        return next;
      });
    }, 50); // 20fps updates for position drift

    return () => clearInterval(interval);
  }, [agentStates, agents, meetingMode]);

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

  // Detect collaborations between agents
  useEffect(() => {
    const collabs: Collaboration[] = [];

    Object.entries(agentStates).forEach(([id, state]) => {
      // Handoff = direct collaboration
      if (state.handoff && state.handoff.from === id) {
        collabs.push({
          from: id,
          to: state.handoff.to,
          task: state.handoff.task,
          intensity: 0.8,
        });
      }

      // Same activity = possible collaboration
      const sameActivity = Object.entries(agentStates)
        .filter(([otherId, otherState]) =>
          otherId !== id &&
          otherState.activity === state.activity &&
          state.status === 'working' &&
          otherState.status === 'working'
        )
        .map(([otherId]) => otherId);

      sameActivity.forEach((otherId) => {
        collabs.push({
          from: id,
          to: otherId,
          task: state.activity,
          intensity: 0.5,
        });
      });
    });

    // Deduplicate (A-B same as B-A)
    const uniqueCollabs = collabs.filter((c, i, arr) =>
      !arr.slice(0, i).some(
        cc => (cc.from === c.from && cc.to === c.to) ||
             (cc.from === c.to && cc.to === c.from)
      )
    );

    setCollaborations(uniqueCollabs);
  }, [agentStates]);

  // Demo mode activation: force agents to their assigned zone positions immediately
  useEffect(() => {
    if (!demoMode || Object.keys(agentPositions).length === 0) return;

    // Force agents to their zone positions on demo start
    setAgentPositions(prev => {
      const next = { ...prev };
      Object.entries(DEMO_AGENT_ZONES).forEach(([agentId, zone]) => {
        const center = ZONE_CENTERS[zone];
        if (center && next[agentId]) {
          // Jitter within zone (40-60px radius)
          const jitter = 40 + Math.random() * 20;
          const angle = Math.random() * Math.PI * 2;
          next[agentId] = {
            ...next[agentId],
            currentX: center.x + Math.cos(angle) * jitter,
            currentY: center.y + Math.sin(angle) * jitter,
            targetX: center.x + Math.cos(angle) * jitter,
            targetY: center.y + Math.sin(angle) * jitter,
            zone: zone,
          };
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]); // Only runs when demoMode changes to true

  // Demo mode: simulate agent activity
  useEffect(() => {
    if (!demoMode || agents.length === 0) {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      return;
    }

    const intensitySettings = {
      calm: { interval: 10000, activeRatio: 0.3 }, // 8-12s avg
      normal: { interval: 6500, activeRatio: 0.5 }, // 5-8s avg
      busy: { interval: 4000, activeRatio: 0.7 }, // 3-5s avg
    };

    const settings = intensitySettings[demoIntensity];
    const interval = settings.interval / demoSpeed;

    const simulateActivity = () => {
      setAgentStates((prev) => {
        const next = { ...prev };
        const agentIds = Object.keys(prev);

        // Pick random agents to activate based on intensity
        const numActive = Math.floor(agentIds.length * settings.activeRatio);
        const shuffled = [...agentIds].sort(() => Math.random() - 0.5);
        const activeAgents = shuffled.slice(0, numActive);

        agentIds.forEach((id) => {
          const isActive = activeAgents.includes(id);
          const activities = ACTIVITIES[id] || ["Working..."];

          if (isActive) {
            // Simulate working state with random activity
            next[id] = {
              ...prev[id],
              state: 'working',
              status: 'working',
              activity: activities[Math.floor(Math.random() * activities.length)],
              lastMessage: generateDemoMessage(id, activities),
            };
          } else {
            // Idle state
            next[id] = {
              ...prev[id],
              state: 'idle',
              status: 'idle',
              activity: ACTIVITIES[id]?.[0] || "Idle",
              lastMessage: '',
            };
          }
        });

        return next;
      });

      // Periodically move agents between zones (5-8 second transitions)
      if (Math.random() < 0.15) {
        setAgentPositions(prev => {
          const next = { ...prev };
          const agentIds = Object.keys(prev);
          const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];

          // Pick a new zone different from current
          const zones = ['forge', 'stream', 'pulse', 'void'];
          const currentZone = prev[randomAgent]?.zone || 'void';
          const availableZones = zones.filter(z => z !== currentZone);
          const newZone = availableZones[Math.floor(Math.random() * availableZones.length)];

          const center = ZONE_CENTERS[newZone];
          const jitter = ZONE_JITTER[newZone] || 50;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * jitter;

          next[randomAgent] = {
            ...prev[randomAgent],
            targetX: center.x + Math.cos(angle) * radius,
            targetY: center.y + Math.sin(angle) * radius,
            zone: newZone,
          };

          return next;
        });
      }

      // Simulate chat messages in demo mode
      const chatInterval = demoIntensity === 'calm' ? 10000 : demoIntensity === 'normal' ? 5000 : 3000;
      const chatDelay = Math.random() * (chatInterval * 0.4); // Add some randomness

      setTimeout(() => {
        if (!demoMode) return;

        const nextChatIndex = demoChatIndex % DEMO_CHAT_MESSAGES.length;
        const chatMessage = DEMO_CHAT_MESSAGES[nextChatIndex];

        // Show typing indicator first (with display name for later use)
        setTypingIndicator({
          agentId: chatMessage.from,
          targetAgentId: chatMessage.to !== 'all' ? chatMessage.to : null,
          startTime: Date.now(),
        });

        // Then show message after typing delay
        setTimeout(() => {
          if (!demoMode) return;

          // Use AGENT_DISPLAY_NAMES mapping for correct display names
          const displayName = AGENT_DISPLAY_NAMES[chatMessage.from] || chatMessage.from;

          setChatMessages(prev => [
            ...prev,
            {
              agent: chatMessage.from,
              name: displayName,
              text: chatMessage.text,
            },
          ]);

          setTypingIndicator({ agentId: null, targetAgentId: null, startTime: 0 });
          setDemoChatIndex(prev => prev + 1);
        }, 1500); // 1.5s typing delay
      }, chatDelay);

      // Occasionally simulate handoffs
      if (Math.random() < 0.3 * demoSpeed) {
        const agentIds = Object.keys(agentStates);
        const from = agentIds[Math.floor(Math.random() * agentIds.length)];
        let to = agentIds[Math.floor(Math.random() * agentIds.length)];
        while (to === from) {
          to = agentIds[Math.floor(Math.random() * agentIds.length)];
        }

        const tasks = [
          "Review the new spec",
          "Handoff for QA",
          "Needs design review",
          "Ready for testing",
          "Client feedback ready",
          "Content brief complete",
        ];

        // Create energy beam for handoff
        const fromColor = AGENT_COLORS[from]?.body || '#888';
        setEnergyBeams(prev => [
          ...prev,
          {
            from,
            to,
            startTime: Date.now(),
            color: fromColor,
          },
        ]);

        setAgentStates((prev) => ({
          ...prev,
          [from]: {
            ...prev[from],
            handoff: {
              from,
              to,
              task: tasks[Math.floor(Math.random() * tasks.length)],
            },
          },
        }));

        // Clear handoff after 3 seconds
        setTimeout(() => {
          setAgentStates((prev) => ({
            ...prev,
            [from]: {
              ...prev[from],
              handoff: null,
            },
          }));
        }, 3000);

        // Remove energy beam after 3 seconds (matches handoff duration)
        setTimeout(() => {
          setEnergyBeams(prev => prev.filter(b => !(b.from === from && b.to === to)));
        }, 3000);
      }

      // Occasionally trigger build celebrations
      if (Math.random() < 0.1 * demoSpeed) {
        const agentIds = Object.keys(agentStates);
        const agent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const builds = [
          "Floor Demo Mode",
          "Pipeline Update",
          "Nexus v2.4",
          "Agent Sync",
          "Content Flow",
        ];

        setAgentStates((prev) => ({
          ...prev,
          [agent]: {
            ...prev[agent],
            buildCelebration: {
              agentId: agent,
              buildName: builds[Math.floor(Math.random() * builds.length)],
            },
          },
        }));

        // Clear after 5 seconds
        setTimeout(() => {
          setAgentStates((prev) => ({
            ...prev,
            [agent]: {
              ...prev[agent],
              buildCelebration: null,
            },
          }));
        }, 5000 / demoSpeed);
      }
    };

    // Run immediately
    simulateActivity();

    // Then run on interval
    demoIntervalRef.current = setInterval(simulateActivity, interval);

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode, demoSpeed, demoIntensity, agents, agentStates, demoChatIndex]);

  // Adjust particle count based on activity + demo mode
  useEffect(() => {
    const activeAgents = Object.values(agentStates).filter(s => s.status === 'working').length;
    let targetCount = 30 + activeAgents * 5;

    // Boost particles in demo mode
    if (demoMode) {
      const demoBoost = demoIntensity === 'busy' ? 40 : demoIntensity === 'normal' ? 20 : 10;
      targetCount += demoBoost;
    }

    setParticleCount(Math.min(targetCount, 150));
  }, [agentStates, demoMode, demoIntensity]);

  // Save snapshots every 10 minutes
  useEffect(() => {
    const saveSnapshot = async () => {
      if (Object.keys(agentStates).length === 0) return;
      
      const snapshot = {
        agents: Object.fromEntries(
          Object.entries(agentStates).map(([id, state]) => {
            const pos = agentPositions[id];
            return [
              id,
              {
                status: state.status || 'idle',
                activity: state.activity,
                position: pos ? { x: pos.currentX, y: pos.currentY } : ZONE_CENTERS.void,
              },
            ];
          })
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
  }, [agentStates, agentPositions]);

  // Canvas rendering for energy arcs and particles
  useEffect(() => {
    const canvas = arcCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render ambient particles (zone-specific)
      setParticles(prev => {
        const next = [...prev];
        next.slice(0, particleCount).forEach((p, i) => {
          if (i >= particleCount) return;

          p.x += p.vx;
          p.y += p.vy;

          // Keep particles within their assigned zone (with gentle boundary)
          if (p.zone) {
            const center = ZONE_CENTERS[p.zone];
            const dx = p.x - center.x;
            const dy = p.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 120; // Maximum distance from zone center

            if (distance > maxRadius) {
              // Gently push back toward zone center
              const angle = Math.atan2(dy, dx);
              p.vx -= Math.cos(angle) * 0.01;
              p.vy -= Math.sin(angle) * 0.01;
            }

            // Draw particle with zone-specific color
            const zoneColor = ZONE_COLORS[p.zone as keyof typeof ZONE_COLORS];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = zoneColor?.glow.replace('0.3', p.opacity.toString()) || `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
          } else {
            // Fallback for non-zone particles
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
          }
        });
        return next;
      });

      // Render waterfall particles
      setWaterfallParticles(prev => {
        const next = [...prev];
        next.forEach(p => {
          p.y += p.speed;

          // Reset to top when off screen
          if (p.y > 500) {
            p.y = 100 + Math.random() * 100;
            p.speed = Math.random() * 1.5 + 0.5;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.fill();
        });
        return next;
      });

      // Render collaboration arcs
      collaborations.forEach((collab) => {
        const fromPos = agentPositions[collab.from];
        const toPos = agentPositions[collab.to];

        if (!fromPos || !toPos) return;

        const fromColor = AGENT_COLORS[collab.from]?.body || '#888';
        const toColor = AGENT_COLORS[collab.to]?.body || '#888';

        // Draw arc (quadratic curve with control point)
        const midX = (fromPos.currentX + toPos.currentX) / 2;
        const midY = (fromPos.currentY + toPos.currentY) / 2 - 40;

        // Create gradient
        const gradient = ctx.createLinearGradient(
          fromPos.currentX, fromPos.currentY,
          toPos.currentX, toPos.currentY
        );
        gradient.addColorStop(0, fromColor);
        gradient.addColorStop(1, toColor);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(fromPos.currentX, fromPos.currentY);
        ctx.quadraticCurveTo(midX, midY, toPos.currentX, toPos.currentY);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + collab.intensity * 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3 + collab.intensity * 0.4;
        ctx.stroke();

        // Particle flow along arc
        const particleCount = 5;
        const time = Date.now() / 1000;

        for (let j = 0; j < particleCount; j++) {
          const t = ((time * 0.5 + j / particleCount) % 1);
          const x = bezierX(
            fromPos.currentX, fromPos.currentY,
            midX, midY,
            toPos.currentX, toPos.currentY,
            t
          );
          const y = bezierY(
            fromPos.currentX, fromPos.currentY,
            midX, midY,
            toPos.currentX, toPos.currentY,
            t
          );

          ctx.beginPath();
          ctx.arc(x, y, 2 + collab.intensity * 2, 0, Math.PI * 2);
          ctx.fillStyle = fromColor;
          ctx.globalAlpha = 0.8;
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });

      // Render energy beams (demo mode handoffs) - curved bezier arcs with glow
      energyBeams.forEach((beam) => {
        const fromPos = agentPositions[beam.from];
        const toPos = agentPositions[beam.to];

        if (!fromPos || !toPos) return;

        const elapsed = Date.now() - beam.startTime;
        const duration = 3000; // 3 seconds

        if (elapsed > duration) return;

        // Fade in/out
        let alpha = 0;
        if (elapsed < 500) {
          alpha = elapsed / 500; // Fade in
        } else if (elapsed > 2500) {
          alpha = 1 - (elapsed - 2500) / 500; // Fade out
        } else {
          alpha = 1;
        }

        // Pulsing effect (2-3 pulses over 3 seconds)
        const pulsePhase = (elapsed / duration) * Math.PI * 6;
        const pulse = 1 + Math.sin(pulsePhase) * 0.3;

        // Draw curved energy beam - quadratic bezier arc
        const midX = (fromPos.currentX + toPos.currentX) / 2;
        const midY = (fromPos.currentY + toPos.currentY) / 2 - 80; // Arc upward per spec

        ctx.save();

        // Outer glow layer (wider, softer)
        ctx.shadowBlur = 20;
        ctx.shadowColor = beam.color;
        ctx.globalAlpha = alpha * 0.5;

        ctx.beginPath();
        ctx.moveTo(fromPos.currentX, fromPos.currentY);
        ctx.quadraticCurveTo(midX, midY, toPos.currentX, toPos.currentY);

        ctx.strokeStyle = beam.color;
        ctx.lineWidth = 6 * pulse;
        ctx.lineCap = 'round';
        ctx.setLineDash([]); // Solid line, not dotted
        ctx.stroke();

        // Middle layer (main beam)
        ctx.shadowBlur = 15;
        ctx.globalAlpha = alpha * 0.8;

        ctx.beginPath();
        ctx.moveTo(fromPos.currentX, fromPos.currentY);
        ctx.quadraticCurveTo(midX, midY, toPos.currentX, toPos.currentY);

        ctx.strokeStyle = beam.color;
        ctx.lineWidth = 3 * pulse;
        ctx.stroke();

        // Inner bright core
        ctx.beginPath();
        ctx.moveTo(fromPos.currentX, fromPos.currentY);
        ctx.quadraticCurveTo(midX, midY, toPos.currentX, toPos.currentY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = alpha;
        ctx.stroke();

        // Draw data flow particles along the beam
        const numParticles = 4;
        for (let i = 0; i < numParticles; i++) {
          const t = ((elapsed / duration + i / numParticles) % 1);
          const x = bezierX(
            fromPos.currentX, fromPos.currentY,
            midX, midY,
            toPos.currentX, toPos.currentY,
            t
          );
          const y = bezierY(
            fromPos.currentX, fromPos.currentY,
            midX, midY,
            toPos.currentX, toPos.currentY,
            t
          );

          // Glowing particle with trail
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = beam.color;
          ctx.globalAlpha = alpha;
          ctx.fill();

          // Trail effect
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = beam.color;
          ctx.globalAlpha = alpha * 0.3;
          ctx.fill();
        }

        ctx.restore();
      });

      requestAnimationFrame(render);
    };

    render();

    return () => {
      // Cleanup not needed for requestAnimationFrame
    };
  }, [collaborations, agentPositions, particles, waterfallParticles, particleCount, energyBeams]);

  // Meeting dialogue playback
  useEffect(() => {
    if (meetingMode && meetingLines.length > 0 && currentLineIdx < meetingLines.length) {
      const timer = setTimeout(() => {
        setCurrentLineIdx(i => i + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [meetingMode, meetingLines, currentLineIdx]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes agent-pulse {
          0%, 100% { box-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
          50% { box-shadow: 0 0 15px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
        }
        @keyframes agent-idle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
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
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${meetingMode ? "bg-red-500 text-white hover:bg-red-600" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}
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

            {/* Demo Mode Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                demoMode
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {demoMode ? (
                <>
                  <span className="animate-pulse">🎬</span>
                  Demo On
                </>
              ) : (
                <>🎬 Demo</>
              )}
            </button>

            {demoMode && (
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1">
                <select
                  value={demoSpeed}
                  onChange={(e) => setDemoSpeed(parseFloat(e.target.value))}
                  className="bg-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 border border-zinc-600"
                >
                  <option value={0.5}>0.5x (cinematic)</option>
                  <option value={1}>1x (realistic)</option>
                </select>

                <select
                  value={demoIntensity}
                  onChange={(e) => setDemoIntensity(e.target.value as 'calm' | 'normal' | 'busy')}
                  className="bg-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 border border-zinc-600"
                >
                  <option value="calm">Calm</option>
                  <option value="normal">Normal</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            )}

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
              <div className={`w-[160px] h-[90px] rounded-[50%] border transition-all duration-500 ${meetingMode ? "border-[#FFE135]/60 shadow-[0_0_30px_rgba(255,225,53,0.3)] bg-[#FFE135]/5" : "border-zinc-600/30 bg-zinc-700/10"}`}>
                {/* Inner glow ring */}
                {meetingMode && (
                  <div className="absolute inset-0 rounded-[50%]" style={{
                    boxShadow: "inset 0 0 20px rgba(251,191,36,0.2)",
                  }} />
                )}
              </div>
            </div>

            {/* Zone background glows */}
            {Object.entries(ZONE_CENTERS).map(([zoneName, center]) => (
              <div
                key={zoneName}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: center.x - 120,
                  top: center.y - 80,
                  width: 240,
                  height: 160,
                  background: `radial-gradient(circle, ${ZONE_COLORS[zoneName as keyof typeof ZONE_COLORS].glow} 0%, transparent 70%)`,
                  opacity: 0.4,
                  filter: 'blur(40px)',
                  mixBlendMode: 'screen',
                }}
              />
            ))}

            {/* Organic Plants */}
            <OrganicPlant x={30} y={530} type="coral" />
            <OrganicPlant x={800} y={530} type="orb" />
            <OrganicPlant x={30} y={130} type="vine" />
            <OrganicPlant x={800} y={130} type="coral" />
            <OrganicPlant x={780} y={200} type="vine" />

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
                  const dx = pos1.currentX - pos2.currentX;
                  const dy = pos1.currentY - pos2.currentY;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Only connect if within 150px
                  if (distance > 150) return null;

                  return (
                    <line
                      key={`line-${agent1.id}-${agent2.id}`}
                      x1={pos1.currentX}
                      y1={pos1.currentY}
                      x2={pos2.currentX}
                      y2={pos2.currentY}
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

            </svg>

            {/* Canvas overlay for energy arcs and particles */}
            <canvas
              ref={arcCanvasRef}
              width={840}
              height={640}
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 25 }}
            />

            {/* Agents */}
            {agents.map((agent) => {
              const agentPos = agentPositions[agent.id];
              if (!agentPos) return null;

              const walkingTo = walkingAgents[agent.id];
              const targetPos = walkingTo ? agentPositions[walkingTo.targetId] : null;
              const pos = walkingTo && targetPos
                ? { x: (agentPos.currentX + targetPos.currentX) / 2, y: (agentPos.currentY + targetPos.currentY) / 2 }
                : { x: agentPos.currentX, y: agentPos.currentY };

              const colors = AGENT_COLORS[agent.id] || { body: "#888", accent: "#666", label: "#888" };
              const isSpeaking = meetingMode && currentSpeaker === agent.name;
              const isSelected = selectedAgent === agent.id;
              const isChatSelected = selectedAgents.includes(agent.id);
              const agentState = agentStates[agent.id];
              const isWorking = agentState?.status === 'working';
              const isErrored = agentState?.status === 'errored';
              const isDead = agentState?.status === 'dead';

              if (!agentState) return null;

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
                        <div className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce">
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
                      <div className="bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
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

                  {/* Float animation for idle agents */}
                  {!isDead && !isErrored && !isWorking && !isSpeaking && !agentState?.buildCelebration && (
                    <div className="absolute inset-0" style={{
                      animation: 'float 3s ease-in-out infinite',
                      animationDelay: `${agent.id.charCodeAt(0) * 100}ms`,
                    }} />
                  )}

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

            {/* Timeline button (TODO: not functional, disabled) */}
            {/*
            {!timelineMode && !meetingMode && (
              <button
                onClick={loadTimeline}
                className="absolute bottom-4 right-4 px-3 py-1 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold rounded z-50"
              >
                📊 Timeline
              </button>
            )}
            */}

            {/* Room label */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                {meetingMode ? <><Calendar size={10} /> Standup In Progress</> : timelineMode ? "⏮️ Replay Mode" : "Villanueva Creative HQ"}
              </span>
            </div>

            {/* Demo mode indicator */}
            {demoMode && (
              <div className="absolute top-2 left-2 z-40">
                <div className="bg-[#FFE135]/20 border border-[#FFE135]/40 rounded-lg px-3 py-1.5 backdrop-blur-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse" />
                  <span className="text-[10px] text-zinc-800 font-bold uppercase tracking-wide">
                    Demo Mode • {demoIntensity} • {demoSpeed}x
                  </span>
                </div>
              </div>
            )}
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
                    className="px-3 py-1 bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
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
                  <>
                    {/* Typing indicator */}
                    {typingIndicator.agentId && (
                      <div className="animate-fade-in">
                        <span className="text-xs font-bold" style={{ color: AGENT_COLORS[typingIndicator.agentId]?.label || '#888' }}>
                          {AGENT_DISPLAY_NAMES[typingIndicator.agentId] || typingIndicator.agentId}:
                        </span>
                        <span className="text-xs text-zinc-400 ml-1">
                          <span className="inline-flex gap-1">
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </span>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => {
                      const colors = AGENT_COLORS[msg.agent] || { label: "#888" };
                      const agent = agents.find(a => a.id === msg.agent);
                      return (
                        <div key={i} className="animate-fade-in">
                          <span className="text-xs font-bold" style={{ color: colors.label }}>{agent?.name || msg.name}:</span>
                          <span className="text-xs text-zinc-300 ml-1">{msg.text}</span>
                        </div>
                      );
                    })}
                  </>
                ) : !meetingMode && handoffMessages.length > 0 ? (
                  handoffMessages.slice(0, 10).map((msg, i) => {
                    const fromColors = AGENT_COLORS[msg.from] || { label: '#888' };
                    const toColors = AGENT_COLORS[msg.to] || { label: '#888' };

                    const fromAgent = agents.find(a => a.id === msg.from);
                    const toAgent = agents.find(a => a.id === msg.to);

                    return (
                      <div key={i} className="animate-fade-in p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: fromColors.label }}>
                            {fromAgent?.name || msg.from}
                          </span>
                          <span className="text-[10px] text-zinc-600">→</span>
                          <span className="text-xs font-bold" style={{ color: toColors.label }}>
                            {toAgent?.name || msg.to}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">{msg.task}</p>
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
                      <div className="text-[10px] text-zinc-600">
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
              <h4 className="text-xs font-bold text-zinc-300 mb-2">Ecosystem Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">The Forge (Building)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">The Stream (Research)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">The Pulse (Comms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-[10px] text-zinc-400">The Void (Idle)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">Error</span>
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

// Organic Plant - enhanced floating elements
function OrganicPlant({ x, y, type }: { x: number; y: number; type: 'vine' | 'orb' | 'coral' }) {
  if (type === 'orb') {
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
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(74, 222, 128, 0.3) 100%)',
            }}
          />
          {/* Subtle orbiting speck */}
          <div
            className="absolute w-1 h-1 bg-zinc-300 rounded-full opacity-60"
            style={{
              left: '50%',
              top: '50%',
              animation: 'orbit 4s linear infinite',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
    );
  }

  if (type === 'vine') {
    return (
      <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
        <div
          className="w-4 h-16 relative"
          style={{
            background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.6) 0%, transparent 100%)',
            filter: 'blur(1px)',
            mixBlendMode: 'screen',
          }}
        >
          {/* Leaves */}
          <div className="absolute -left-2 top-4 w-3 h-2 bg-zinc-400 rounded-full opacity-40" />
          <div className="absolute right-0 top-8 w-3 h-2 bg-zinc-400 rounded-full opacity-40" />
          <div className="absolute -left-3 top-12 w-2 h-2 bg-zinc-500 rounded-full opacity-50" />
        </div>
      </div>
    );
  }

  // Coral / organic structure
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      <div
        className="relative w-8 h-8"
        style={{ mixBlendMode: 'screen' }}
      >
        {[...Array(5)].map((_, i) => {
          const angle = (i * 72) * Math.PI / 180;
          const length = 10 + Math.sin(Date.now() / 1000 + i) * 2;
          return (
            <div
              key={i}
              className="absolute origin-bottom"
              style={{
                left: '50%',
                bottom: '50%',
                width: '2px',
                height: `${length}px`,
                background: 'linear-gradient(180deg, rgba(251, 146, 60, 0.6), transparent)',
                transform: `rotate(${angle}rad)`,
                transformOrigin: 'bottom center',
              }}
            />
          );
        })}
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
