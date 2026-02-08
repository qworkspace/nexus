import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface AgentSession {
  id: string;
  label: string;
  model: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  startedAt: string;
  tokensUsed?: number;
  currentTask?: string;
  progress?: number;
  channel?: string;
}

interface AgentStatusResponse {
  source: 'live' | 'mock' | 'error';
  agents: AgentSession[];
  queue: { id: string; spec: string; priority: number }[];
  recentCompletions: { id: string; label: string; completedAt: string; commitUrl?: string }[];
  error?: string;
}

export async function GET(): Promise<NextResponse<AgentStatusResponse>> {
  try {
    // Try to get sessions from OpenClaw
    let sessionsResult: string;
    try {
      sessionsResult = execSync('openclaw session list --json 2>/dev/null || echo "[]"', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      sessionsResult = '[]';
    }

    let sessions: AgentSession[] = [];
    try {
      const parsed = JSON.parse(sessionsResult);
      if (Array.isArray(parsed)) {
        sessions = parsed.map((s: Record<string, unknown>) => ({
          id: String(s.id || ''),
          label: String(s.label || s.name || 'Unknown'),
          model: String(s.model || 'unknown'),
          status: (['active', 'idle', 'completed', 'error'].includes(String(s.status)) 
            ? String(s.status) 
            : 'idle') as AgentSession['status'],
          startedAt: String(s.startedAt || s.createdAt || new Date().toISOString()),
          tokensUsed: typeof s.tokensUsed === 'number' ? s.tokensUsed : 0,
          currentTask: typeof s.currentTask === 'string' ? s.currentTask : undefined,
          progress: typeof s.progress === 'number' ? s.progress : undefined,
          channel: typeof s.channel === 'string' ? s.channel : undefined,
        }));
      }
    } catch {
      // Return mock data if parsing fails
      sessions = [
        {
          id: 'main',
          label: 'Q (Main)',
          model: 'claude-opus-4-5',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          tokensUsed: 45230,
          currentTask: 'Building Mission Control v2',
          progress: 65,
          channel: 'telegram',
        },
        {
          id: 'dev-cryptomon',
          label: 'Dev (CryptoMon)',
          model: 'claude-sonnet-4',
          status: 'idle',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          tokensUsed: 128450,
          currentTask: 'Waiting for next spec',
        },
      ];
    }

    // Mock queue and completions (would come from a task system)
    const queue = [
      { id: 'spec-001', spec: 'Implement wallet connection', priority: 1 },
      { id: 'spec-002', spec: 'Add price alerts', priority: 2 },
    ];

    const recentCompletions = [
      { 
        id: 'comp-001', 
        label: 'CryptoMon dashboard layout', 
        completedAt: new Date(Date.now() - 1800000).toISOString(),
        commitUrl: 'https://github.com/pjv/cryptomon/commit/abc123',
      },
      { 
        id: 'comp-002', 
        label: 'API rate limiting', 
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        commitUrl: 'https://github.com/pjv/cryptomon/commit/def456',
      },
    ];

    return NextResponse.json({
      source: sessions.length > 0 ? 'live' : 'mock',
      agents: sessions,
      queue,
      recentCompletions,
    });
  } catch (error) {
    console.error('Failed to fetch agent status:', error);
    return NextResponse.json({
      source: 'error',
      agents: [],
      queue: [],
      recentCompletions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
