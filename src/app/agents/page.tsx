import { AgentCard } from "@/components/agents/agent-card";
import { AgentStats } from "@/components/agents/agent-stats";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  description: string;
  workspace: string;
  status: 'online' | 'offline' | 'busy';
  tasksToday: number;
  tokensUsed: number;
}

// Mock data for our agents
const agents: Agent[] = [
  {
    id: 'main',
    name: 'Q',
    emoji: '🦾',
    model: 'claude-3-5-sonnet',
    description: 'Primary assistant - coordinates all agents and handles high-level decision making.',
    workspace: '~/dev/',
    status: 'online',
    tasksToday: 42,
    tokensUsed: 156000,
  },
  {
    id: 'dev',
    name: 'Dev',
    emoji: '💻',
    model: 'glm-4.7',
    description: 'Code builder - handles technical tasks, writes code, and manages infrastructure.',
    workspace: '~/dev/',
    status: 'busy',
    tasksToday: 28,
    tokensUsed: 89400,
  },
  {
    id: 'creative',
    name: 'Creative',
    emoji: '🎨',
    model: 'claude-3-5-sonnet',
    description: 'Brand & content - creates marketing materials, writes copy, and designs visual assets.',
    workspace: '~/dev/',
    status: 'online',
    tasksToday: 15,
    tokensUsed: 67800,
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '📈',
    model: 'gpt-4o',
    description: 'Marketing and growth strategies - analyzes metrics and plans campaigns.',
    workspace: '~/dev/',
    status: 'online',
    tasksToday: 12,
    tokensUsed: 45600,
  },
  {
    id: 'research',
    name: 'Research',
    emoji: '🔬',
    model: 'claude-3-5-sonnet',
    description: 'Information gathering - conducts research and compiles findings.',
    workspace: '~/dev/',
    status: 'offline',
    tasksToday: 8,
    tokensUsed: 34500,
  },
  {
    id: 'events',
    name: 'Events',
    emoji: '📅',
    model: 'gpt-4o',
    description: 'Event management - coordinates schedules and manages calendar.',
    workspace: '~/dev/',
    status: 'online',
    tasksToday: 18,
    tokensUsed: 54300,
  },
  {
    id: 'support',
    name: 'Support',
    emoji: '🎧',
    model: 'gpt-4o-mini',
    description: 'Customer support - handles inquiries and resolves issues.',
    workspace: '~/dev/',
    status: 'busy',
    tasksToday: 35,
    tokensUsed: 123000,
  },
  {
    id: 'design',
    name: 'Design',
    emoji: '✨',
    model: 'claude-3-5-sonnet',
    description: 'UI/UX design - creates interfaces and improves user experience.',
    workspace: '~/dev/',
    status: 'online',
    tasksToday: 11,
    tokensUsed: 42300,
  },
  {
    id: 'testing',
    name: 'Testing',
    emoji: '🧪',
    model: 'glm-4.7',
    description: 'Quality assurance - runs tests and identifies bugs.',
    workspace: '~/dev/',
    status: 'offline',
    tasksToday: 7,
    tokensUsed: 28900,
  },
];

export default function AgentsPage() {
  // Calculate stats
  const totalAgents = agents.length;
  const activeNow = agents.filter(a => a.status !== 'offline').length;
  const tasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0);

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Agent Directory</h1>
        <p className="text-zinc-500 text-sm">
          View and manage all configured agents
        </p>
      </div>

      {/* Stats Summary */}
      <div className="mb-8">
        <AgentStats
          totalAgents={totalAgents}
          activeNow={activeNow}
          tasksToday={tasksToday}
        />
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
