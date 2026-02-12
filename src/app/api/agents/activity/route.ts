import { NextResponse } from 'next/server';
import {
  fetchOpenClawSessions,
  loadAgentRoster,
  getAgentInfo,
  parseAgentFromKey,
  extractTaskFromKey,
} from '@/lib/data-utils';
import type { AgentActivityData, AgentSession } from '@/types/agents';

export async function GET() {
  try {
    // Get agent roster
    const roster = await loadAgentRoster();

    // Fetch active sessions from OpenClaw
    const sessionsData = await fetchOpenClawSessions(60); // Active in last 60 minutes

    // Transform sessions to agent format
    const sessions: AgentSession[] = sessionsData.sessions.map((session) => {
      const { agent: agentId, channel } = parseAgentFromKey(session.key as string);
      const agentInfo = getAgentInfo(roster, agentId);
      const ageMs = session.ageMs as number;
      const totalTokens = session.totalTokens as number;

      // Determine status: active if updated in last 5 minutes, otherwise idle
      const status: 'active' | 'idle' | 'error' = ageMs < 300000 ? 'active' : 'idle';

      return {
        id: session.sessionId as string,
        key: session.key as string,
        label: agentInfo?.name || agentId,
        emoji: agentInfo?.emoji || '🤖',
        role: agentInfo?.role || 'Agent',
        model: session.model as string,
        status,
        startedAt: new Date(Date.now() - ageMs).toISOString(),
        ageMs,
        tokensUsed: totalTokens || 0,
        currentTask: extractTaskFromKey(session.key as string) || session.label as string,
        channel,
        agentId,
      };
    });

    // Calculate statistics
    const activeCount = sessions.filter((s) => s.status === 'active').length;
    const idleCount = sessions.filter((s) => s.status === 'idle').length;
    const totalTokens = sessions.reduce((sum, s) => sum + s.tokensUsed, 0);
    const longestRunning = Math.max(...sessions.map((s) => s.ageMs), 0);

    const activityData: AgentActivityData = {
      sessions,
      stats: {
        totalAgents: sessions.length,
        activeAgents: activeCount,
        idleAgents: idleCount,
        totalTokens,
        longestRunningSession: Math.floor(longestRunning / 60000), // Convert to minutes
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(activityData);
  } catch (error) {
    console.error('Failed to fetch agent activity:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch agent activity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
