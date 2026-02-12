// Agent Activity Types

export interface AgentSession {
  id: string;
  key: string;
  label: string;
  emoji: string;
  role: string;
  model: string;
  status: 'active' | 'idle' | 'error';
  startedAt: string;
  ageMs: number;
  tokensUsed: number;
  currentTask?: string;
  channel?: string;
  agentId?: string;
}

export interface AgentActivityData {
  sessions: AgentSession[];
  stats: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    totalTokens: number;
    longestRunningSession: number; // in minutes
  };
  lastUpdated: string;
}
