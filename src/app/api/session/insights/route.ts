import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  tokensUsed: number;
  cost: number;
  tasksCompleted: number;
  channel: string;
}

interface SessionInsightsResponse {
  source: 'live' | 'mock' | 'error';
  current: {
    startedAt: string;
    durationMs: number;
    tokensUsed: number;
    cost: number;
    model: string;
  };
  today: {
    sessions: number;
    totalTokens: number;
    totalCost: number;
    summaries: SessionSummary[];
  };
  error?: string;
}

export async function GET(): Promise<NextResponse<SessionInsightsResponse>> {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Try to get real data
    let todayActivities: { timestamp: Date; tokensIn: number | null; tokensOut: number | null; cost: number | null; type: string | null }[] = [];
    try {
      todayActivities = await db.activity.findMany({
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
    } catch {
      todayActivities = [];
    }

    // Calculate today's stats
    const totalTokens = todayActivities.reduce(
      (sum, a) => sum + (a.tokensIn || 0) + (a.tokensOut || 0),
      0
    );
    const totalCost = todayActivities.reduce(
      (sum, a) => sum + (a.cost || 0),
      0
    );

    // Group into sessions (gap > 30 minutes = new session)
    const sessions: SessionSummary[] = [];
    let currentSession: SessionSummary | null = null;
    const SESSION_GAP_MS = 30 * 60 * 1000;

    for (const activity of [...todayActivities].reverse()) {
      const activityTime = new Date(activity.timestamp).getTime();

      if (!currentSession) {
        currentSession = {
          id: `session-${sessions.length + 1}`,
          startedAt: activity.timestamp.toISOString(),
          durationMs: 0,
          tokensUsed: (activity.tokensIn || 0) + (activity.tokensOut || 0),
          cost: activity.cost || 0,
          tasksCompleted: 1,
          channel: 'telegram',
        };
      } else {
        const lastActivity = new Date(currentSession.startedAt).getTime() + currentSession.durationMs;
        
        if (activityTime - lastActivity > SESSION_GAP_MS) {
          // New session
          currentSession.endedAt = new Date(lastActivity).toISOString();
          sessions.push(currentSession);
          
          currentSession = {
            id: `session-${sessions.length + 1}`,
            startedAt: activity.timestamp.toISOString(),
            durationMs: 0,
            tokensUsed: (activity.tokensIn || 0) + (activity.tokensOut || 0),
            cost: activity.cost || 0,
            tasksCompleted: 1,
            channel: 'telegram',
          };
        } else {
          // Same session
          currentSession.durationMs = activityTime - new Date(currentSession.startedAt).getTime();
          currentSession.tokensUsed += (activity.tokensIn || 0) + (activity.tokensOut || 0);
          currentSession.cost += activity.cost || 0;
          currentSession.tasksCompleted += 1;
        }
      }
    }

    if (currentSession) {
      sessions.push(currentSession);
    }

    // Current session (most recent or mock)
    const latestSession = sessions[sessions.length - 1];
    const currentStarted = latestSession?.startedAt || new Date(Date.now() - 3600000).toISOString();
    const currentDuration = Date.now() - new Date(currentStarted).getTime();

    return NextResponse.json({
      source: todayActivities.length > 0 ? 'live' : 'mock',
      current: {
        startedAt: currentStarted,
        durationMs: currentDuration,
        tokensUsed: latestSession?.tokensUsed || 45230,
        cost: latestSession?.cost || 2.15,
        model: 'claude-opus-4-5',
      },
      today: {
        sessions: sessions.length || 3,
        totalTokens: totalTokens || 125000,
        totalCost: totalCost || 7.52,
        summaries: sessions.slice(-5).reverse(),
      },
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
