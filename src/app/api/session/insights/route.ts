import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  aggregateUsageFromTranscripts,
  fetchOpenClawSessions,
  loadAgentRoster,
  getAgentInfo,
  parseAgentFromKey,
} from '@/lib/data-utils';

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  tokensUsed: number;
  cost: number;
  tasksCompleted: number;
  channel: string;
  agent?: string;
}

interface SessionInsightsResponse {
  source: 'live' | 'mock' | 'error';
  current: {
    startedAt: string;
    durationMs: number;
    tokensUsed: number;
    cost: number;
    model: string;
    agent?: string;
  };
  today: {
    sessions: number;
    totalTokens: number;
    totalCost: number;
    summaries: SessionSummary[];
  };
  byAgent?: { agent: string; sessionCount: number; totalTokens: number; totalCost: number }[];
  byModel?: { model: string; sessionCount: number; totalTokens: number; totalCost: number }[];
  error?: string;
}

export async function GET(): Promise<NextResponse<SessionInsightsResponse>> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const now = new Date();

    // Try to get real data from transcripts
    let source: 'live' | 'mock' | 'error' = 'live';
    const todayUsage = await aggregateUsageFromTranscripts(todayStart, now);

    // Get active sessions from gateway
    const sessionsData = await fetchOpenClawSessions(60);
    const roster = await loadAgentRoster();

    // Calculate today's stats
    const totalTokens = todayUsage.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = todayUsage.reduce((sum, u) => sum + u.cost, 0);

    // Group by agent
    const agentMap = new Map<string, { sessionCount: number; totalTokens: number; totalCost: number }>();
    for (const u of todayUsage) {
      const agent = u.agent || 'main';
      const existing = agentMap.get(agent) || { sessionCount: 0, totalTokens: 0, totalCost: 0 };
      agentMap.set(agent, {
        sessionCount: existing.sessionCount + 1,
        totalTokens: existing.totalTokens + u.totalTokens,
        totalCost: existing.totalCost + u.cost,
      });
    }

    const byAgent = Array.from(agentMap.entries()).map(([agent, stats]) => ({
      agent,
      ...stats,
    }));

    // Group by model
    const modelMap = new Map<string, { sessionCount: number; totalTokens: number; totalCost: number }>();
    for (const u of todayUsage) {
      const model = u.model || 'unknown';
      const existing = modelMap.get(model) || { sessionCount: 0, totalTokens: 0, totalCost: 0 };
      modelMap.set(model, {
        sessionCount: existing.sessionCount + 1,
        totalTokens: existing.totalTokens + u.totalTokens,
        totalCost: existing.totalCost + u.cost,
      });
    }

    const byModel = Array.from(modelMap.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }));

    // Get current active session
    let currentSession = {
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      durationMs: 3600000,
      tokensUsed: 45230,
      cost: 2.15,
      model: 'claude-opus-4-6',
      agent: 'main',
    };

    if (sessionsData.sessions.length > 0) {
      const active = sessionsData.sessions[0]; // Most recent
      const { agent: agentId } = parseAgentFromKey(active.key as string);
      const agentInfo = getAgentInfo(roster, agentId);

      currentSession = {
        startedAt: new Date(Date.now() - (active.ageMs as number)).toISOString(),
        durationMs: active.ageMs as number,
        tokensUsed: active.totalTokens as number,
        cost: todayUsage.filter((u) => u.agent === agentId).reduce((sum, u) => sum + u.cost, 0),
        model: active.model as string,
        agent: agentInfo?.name || agentId,
      };
    }

    // Build session summaries from active sessions
    const summaries: SessionSummary[] = sessionsData.sessions.slice(0, 5).map((s) => {
      const { agent: agentId, channel } = parseAgentFromKey(s.key as string);
      const agentInfo = getAgentInfo(roster, agentId);

      return {
        id: s.sessionId as string,
        startedAt: new Date(Date.now() - (s.ageMs as number)).toISOString(),
        durationMs: s.ageMs as number,
        tokensUsed: s.totalTokens as number,
        cost: 0, // Would need to sum from transcripts
        tasksCompleted: 1,
        channel: channel || 'direct',
        agent: agentInfo?.name || agentId,
      };
    });

    // If no transcript data, fall back to database
    if (todayUsage.length === 0) {
      try {
        const todayActivities = await db.activity.findMany({
          where: {
            timestamp: { gte: todayStart },
          },
          select: {
            timestamp: true,
            tokensIn: true,
            tokensOut: true,
            cost: true,
            type: true,
          },
          orderBy: { timestamp: 'desc' },
        });

        if (todayActivities.length > 0) {
          const dbTotalTokens = todayActivities.reduce(
            (sum, a) => sum + (a.tokensIn || 0) + (a.tokensOut || 0),
            0
          );
          const dbTotalCost = todayActivities.reduce(
            (sum, a) => sum + (a.cost || 0),
            0
          );

          return NextResponse.json({
            source: 'live',
            current: currentSession,
            today: {
              sessions: sessionsData.sessions.length || todayActivities.length,
              totalTokens: dbTotalTokens,
              totalCost: dbTotalCost,
              summaries,
            },
            byAgent,
            byModel,
          });
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
      }

      source = 'mock';
    }

    return NextResponse.json({
      source,
      current: currentSession,
      today: {
        sessions: sessionsData.sessions.length || summaries.length || 3,
        totalTokens: totalTokens || 125000,
        totalCost: totalCost || 7.52,
        summaries: summaries.length > 0 ? summaries : getMockSummaries(),
      },
      byAgent: byAgent.length > 0 ? byAgent : undefined,
      byModel: byModel.length > 0 ? byModel : undefined,
    });
  } catch (error) {
    console.error('Failed to get session insights:', error);
    return NextResponse.json({
      source: 'error',
      current: {
        startedAt: new Date().toISOString(),
        durationMs: 0,
        tokensUsed: 0,
        cost: 0,
        model: 'unknown',
      },
      today: {
        sessions: 0,
        totalTokens: 0,
        totalCost: 0,
        summaries: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getMockSummaries(): SessionSummary[] {
  const now = Date.now();
  return [
    {
      id: 'session-1',
      startedAt: new Date(now - 3600000).toISOString(),
      durationMs: 3600000,
      tokensUsed: 45230,
      cost: 2.15,
      tasksCompleted: 5,
      channel: 'telegram',
      agent: 'Q',
    },
    {
      id: 'session-2',
      startedAt: new Date(now - 7200000).toISOString(),
      endedAt: new Date(now - 3600000).toISOString(),
      durationMs: 3600000,
      tokensUsed: 32100,
      cost: 1.82,
      tasksCompleted: 3,
      channel: 'telegram',
      agent: 'Q',
    },
  ];
}
