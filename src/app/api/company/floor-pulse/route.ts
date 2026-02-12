import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface AgentState {
  id: string;
  status: 'working' | 'idle' | 'errored' | 'dead';
  tokens: number;
  lastMessage: string;
  handoff: { from: string; to: string; task: string } | null;
  buildCelebration: { agentId: string; buildName: string } | null;
}

interface LunaSession {
  sessionId: string;
  updatedAt: number;
  abortedLastRun: boolean;
  sessionFile: string;
  label?: string;
  agentId?: string;
}

interface SessionEntry {
  type: string;
  message?: {
    role: string;
    content?: string | Array<Record<string, unknown>>;
  };
  content?: string;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll every 10 seconds
      const interval = setInterval(async () => {
        try {
          const agentStates = await pollAgentStates();
          sendEvent({ type: 'states', agents: agentStates });
        } catch (err) {
          console.error('Floor pulse error:', err);
          sendEvent({ type: 'error', message: String(err) });
        }
      }, 10000);

      // Initial send
      try {
        const agentStates = await pollAgentStates();
        sendEvent({ type: 'states', agents: agentStates });
      } catch (err) {
        console.error('Floor pulse initial error:', err);
        sendEvent({ type: 'error', message: String(err), offline: true });
      }

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function pollAgentStates(): Promise<AgentState[]> {
  const agentIds = [
    'main', 'creative', 'design', 'growth', 'research',
    'dev', 'testing', 'events', 'support', 'luna',
  ];

  const states: AgentState[] = [];

  // Fetch sessions from Luna filesystem
  const sessions = await fetchLunaSessions();

  // Check for handoffs
  const handoffs = await checkHandoffs();

  // Check for build completions
  const builds = await checkBuilds();

  for (const agentId of agentIds) {
    // Find session for this agent
    const session = sessions.find((s) => 
      s.label?.includes(agentId) || s.agentId === agentId
    );

    if (!session) {
      states.push({
        id: agentId,
        status: 'dead',
        tokens: 0,
        lastMessage: '',
        handoff: null,
        buildCelebration: null,
      });
      continue;
    }

    // Determine status
    const now = Date.now();
    const lastActive = session.updatedAt;
    const idleMinutes = (now - lastActive) / 60000;

    let status: AgentState['status'] = 'idle';
    if (session.abortedLastRun) status = 'errored';
    else if (idleMinutes < 10) status = 'working';

    // Get last message
    const lastMessage = await getLastMessage(session.sessionFile);

    // Check for handoff involving this agent
    const handoff = handoffs.find(
      (h) => h.from === agentId || h.to === agentId
    );

    // Check for build celebration
    const buildCelebration = builds.find((b) => b.agentId === agentId);

    states.push({
      id: agentId,
      status,
      tokens: 0, // Tokens not tracked in Luna sessions
      lastMessage,
      handoff: handoff || null,
      buildCelebration: buildCelebration || null,
    });
  }

  return states;
}

async function fetchLunaSessions(): Promise<LunaSession[]> {
  const sessions: LunaSession[] = [];

  try {
    const lunaAgentsDir = path.join(process.env.HOME!, '.openclaw', 'luna', 'agents');
    const agentDirs = await fs.readdir(lunaAgentsDir);

    for (const agentId of agentDirs) {
      const sessionsFile = path.join(lunaAgentsDir, agentId, 'sessions', 'sessions.json');

      try {
        const content = await fs.readFile(sessionsFile, 'utf-8');
        const sessionsData = JSON.parse(content);

        // Each key in sessions.json is a session ID
        for (const [, sessionData] of Object.entries(sessionsData)) {
          const session = sessionData as LunaSession;
          sessions.push({
            ...session,
            label: agentId,
            agentId: agentId,
          });
        }
      } catch {
        // Sessions file not readable for this agent, skip
      }
    }
  } catch (err) {
    console.error('Failed to read Luna sessions:', err);
  }

  return sessions;
}

async function getLastMessage(sessionFile: string): Promise<string> {
  try {
    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    // Get the last few lines to find the last assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]) as SessionEntry;
        
        // Look for assistant messages
        if (entry.type === 'message' && entry.message?.role === 'assistant') {
          // Extract content from various formats
          let messageContent = '';

          if (typeof entry.message.content === 'string') {
            messageContent = entry.message.content;
          } else if (Array.isArray(entry.message.content)) {
            // Content might be an array of objects with type/content
            const textPart = entry.message.content.find((part: string | Record<string, unknown>) =>
              typeof part === 'string' || (typeof part === 'object' && part !== null && (part as Record<string, unknown>).type === 'text')
            );
            messageContent = typeof textPart === 'string'
              ? textPart
              : (textPart as Record<string, unknown>)?.content as string || '';
          }

          // Extract just the text content, skip "thinking" blocks
          const textOnly = messageContent
            .replace(/\*\*Thinking:\*\*[\s\S]*?(?=\*\*|$)/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/\n/g, ' ')
            .trim();

          return textOnly.substring(0, 50);
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Session file not readable
  }

  return '';
}

async function checkHandoffs(): Promise<Array<{ from: string; to: string; task: string }>> {
  const handoffsDir = path.join(process.env.HOME!, 'shared', 'handoffs');
  const handoffs: Array<{ from: string; to: string; task: string }> = [];

  try {
    const files = await fs.readdir(handoffsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const content = await fs.readFile(path.join(handoffsDir, file), 'utf-8');
      const handoff = JSON.parse(content);
      if (handoff.status === 'pending') {
        handoffs.push({
          from: handoff.from,
          to: handoff.to,
          task: handoff.task,
        });
      }
    }
  } catch {
    // handoffs directory might not exist
  }

  return handoffs;
}

async function checkBuilds(): Promise<Array<{ agentId: string; buildName: string }>> {
  const buildsLog = path.join(process.env.HOME!, 'shared', 'overnight-builds.log');
  const builds: Array<{ agentId: string; buildName: string }> = [];

  try {
    const content = await fs.readFile(buildsLog, 'utf-8');
    const lines = content.split('\n').slice(-10); // Last 10 builds

    // Find recent successful builds (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const line of lines) {
      if (line.includes('BUILD: SUCCESS')) {
        // Parse: [YYYY-MM-DD HH:MM] CI: SPEC_NAME — BUILD: SUCCESS
        const match = line.match(/\[([^\]]+)\] CI: ([^ ]+) — BUILD: SUCCESS/);
        if (match) {
          const timestamp = new Date(match[1]).getTime();
          if (timestamp > fiveMinutesAgo) {
            builds.push({
              agentId: 'dev', // Builds are always Dev agent
              buildName: match[2],
            });
          }
        }
      }
    }
  } catch {
    // builds log might not exist
  }

  return builds;
}
