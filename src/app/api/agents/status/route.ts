import { NextResponse } from 'next/server';
import {
  fetchOpenClawSessions,
  loadAgentRoster,
  getAgentInfo,
  parseAgentFromKey,
  extractTaskFromKey,
  estimateProgress,
  getPendingHandoffs,
  getAllAgentSessions,
  parseSessionTranscript,
} from '@/lib/data-utils';

interface AgentSession {
  id: string;
  label: string;
  emoji: string;
  role: string;
  model: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  startedAt: string;
  tokensUsed?: number;
  currentTask?: string;
  progress?: number;
  channel?: string;
  agentId?: string;
}

interface AgentStatusResponse {
  source: 'live' | 'mock' | 'error';
  agents: AgentSession[];
  queue: { id: string; spec: string; priority: number; from?: string; to?: string; createdAt?: string }[];
  recentCompletions: { id: string; label: string; completedAt: string; commitUrl?: string; agent?: string }[];
  error?: string;
}

export async function GET(): Promise<NextResponse<AgentStatusResponse>> {
  try {
    // Get agent roster
    const roster = await loadAgentRoster();

    // Fetch active sessions from OpenClaw
    const sessionsData = await fetchOpenClawSessions(60); // Active in last 60 minutes

    // Transform sessions to agent format
    const agents: AgentSession[] = sessionsData.sessions.map((session) => {
      const { agent: agentId, channel } = parseAgentFromKey(session.key as string);
      const agentInfo = getAgentInfo(roster, agentId);

      return {
        id: session.sessionId as string,
        label: agentInfo?.name || agentId,
        emoji: agentInfo?.emoji || '🤖',
        role: agentInfo?.role || 'Agent',
        model: session.model as string,
        status: (session.ageMs as number) < 300000 ? 'active' : 'idle', // Active if updated in last 5 min
        startedAt: new Date(Date.now() - (session.ageMs as number)).toISOString(),
        tokensUsed: session.totalTokens as number,
        currentTask: extractTaskFromKey(session.key as string),
        progress: estimateProgress(session.totalTokens as number),
        channel,
        agentId,
      };
    });

    // Get task queue from pending handoffs
    const queue = await getPendingHandoffs();

    // Get recent completions from session transcripts
    const completions = await getRecentCompletions(5);

    return NextResponse.json({
      source: 'live',
      agents,
      queue: queue.map((h) => ({
        id: h.id,
        spec: h.spec,
        priority: h.priority,
        from: h.from,
        to: h.to,
        createdAt: h.createdAt,
      })),
      recentCompletions: completions,
    });
  } catch (error) {
    console.error('Failed to fetch agent status:', error);

    // Return mock data on error
    return NextResponse.json({
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
      agents: [
        {
          id: 'main',
          label: 'Q',
          emoji: "Bot",
          role: 'COO / Chief of Staff',
          model: 'claude-opus-4-6',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          tokensUsed: 178940,
          currentTask: 'Managing operations',
          progress: 65,
          channel: 'telegram',
        },
        {
          id: 'dev',
          label: 'Spark',
          emoji: "Flame",
          role: 'Lead Engineer',
          model: 'claude-sonnet-4-5',
          status: 'idle',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          tokensUsed: 200000,
          currentTask: 'Waiting for next spec',
          agentId: 'dev',
        },
      ],
      queue: [
        { id: 'spec-001', spec: 'Implement wallet connection', priority: 1 },
        { id: 'spec-002', spec: 'Add price alerts', priority: 2 },
      ],
      recentCompletions: [
        {
          id: 'comp-001',
          label: 'Build completed',
          completedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    });
  }
}

async function getRecentCompletions(limit = 5): Promise<Array<{ id: string; label: string; completedAt: string; commitUrl?: string; agent?: string }>> {
  const completions: Array<{ id: string; label: string; completedAt: string; commitUrl?: string; agent?: string }> = [];

  try {
    const sessions = await getAllAgentSessions();

    // Filter sessions older than 1 hour (completed/finished)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const completedSessions = sessions
      .filter((s) => s.lastModified < oneHourAgo)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit);

    for (const session of completedSessions) {
      const messages = await parseSessionTranscript(session.filePath);

      // Find label from first user message
      let label = `${session.agent} Agent Session`;
      let commitUrl: string | undefined;

      for (const msg of messages) {
        if (msg.type === 'user' || msg.role === 'user') {
          const content = typeof msg.content === 'string'
            ? msg.content
            : (msg.content as Array<{ type: string; text?: string }>)?.find((b: { type: string }) => b.type === 'text')?.text || '';

          // Look for spec/task descriptions
          if (content.includes('Spec:') || content.includes('Build')) {
            label = content.substring(0, 50).replace(/\n/g, ' ');
            break;
          }
        }

        // Look for commit URLs
        if (msg.role === 'assistant' && msg.content) {
          const content = typeof msg.content === 'string'
            ? msg.content
            : (msg.content as Array<{ type: string; text?: string }>)?.find((b: { type: string }) => b.type === 'text')?.text || '';

          const commitMatch = content.match(/github\.com\/[^\/]+\/[^\/]+\/commit\/([a-f0-9]{40})/i);
          if (commitMatch) {
            commitUrl = commitMatch[0];
          }
        }
      }

      completions.push({
        id: session.sessionId,
        label,
        completedAt: session.lastModified.toISOString(),
        commitUrl,
        agent: session.agent,
      });
    }
  } catch (error) {
    console.error('Failed to get completions:', error);
  }

  return completions;
}
