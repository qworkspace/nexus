/**
 * Data Utilities - Shared functions for parsing OpenClaw data sources
 */

import { readdir, readFile, stat } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { homedir } from 'os';

// Types
export interface TranscriptUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
  agent?: string;
}

export interface HandoffFile {
  filename: string;
  handoff: {
    status: string;
    task?: string;
    spec_path?: string;
    from: string;
    to: string;
    created_at: string;
    priority?: number;
  };
}

export interface SessionFileInfo {
  agent: string;
  sessionId: string;
  filePath: string;
  lastModified: Date;
}

// ============================================================================
// Agent Roster
// ============================================================================

export async function loadAgentRoster(): Promise<{ agents: Array<{ id: string; name: string; emoji: string; role: string }> }> {
  const rosterPath = path.join(homedir(), 'shared', 'agent-roster.json');
  try {
    const content = await readFile(rosterPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load agent roster:', error);
    return { agents: [] };
  }
}

export function getAgentInfo(roster: { agents: Array<{ id: string; name: string; emoji: string; role: string }> }, agentId: string) {
  return roster.agents?.find((a) => a.id === agentId);
}

// ============================================================================
// OpenClaw Sessions
// ============================================================================

export async function fetchOpenClawSessions(activeMinutes = 60): Promise<{ sessions: Array<Record<string, unknown>> }> {
  try {
    const result = execSync(
      `openclaw sessions list --json --activeMinutes ${activeMinutes}`,
      {
        encoding: 'utf-8',
        timeout: 10000,
      }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to fetch OpenClaw sessions:', error);
    return { sessions: [] };
  }
}

export function parseAgentFromKey(key: string): { agent: string; channel?: string } {
  const parts = key.split(':');

  // Format examples:
  // "agent:main:main" -> main agent, direct
  // "agent:main:subagent:xxx" -> main spawned subagent
  // "agent:main:cron:xxx" -> main cron
  // "agent:main:main:telegram" -> main agent, telegram channel

  if (parts[0] === 'agent' && parts[1]) {
    const agentId = parts[1];
    const channel = ['telegram', 'discord', 'cli', 'web'].includes(parts[parts.length - 1])
      ? parts[parts.length - 1]
      : undefined;

    return { agent: agentId, channel };
  }

  // Legacy format: "spawn:agent:xxx"
  if (parts[0] === 'spawn' && parts[1]) {
    return { agent: parts[1] };
  }

  return { agent: 'unknown' };
}

// ============================================================================
// Session Transcripts
// ============================================================================

export async function getAllAgentSessions(): Promise<SessionFileInfo[]> {
  const agentsDir = path.join(homedir(), '.openclaw', 'agents');
  const sessions: SessionFileInfo[] = [];

  try {
    const agents = await readdir(agentsDir);

    for (const agent of agents) {
      const sessionsDir = path.join(agentsDir, agent, 'sessions');

      try {
        const files = await readdir(sessionsDir);

        for (const file of files) {
          if (!file.endsWith('.jsonl') || file.includes('.deleted.')) continue;

          const filePath = path.join(sessionsDir, file);
          const fileStats = await stat(filePath);

          sessions.push({
            agent,
            sessionId: file.replace('.jsonl', ''),
            filePath,
            lastModified: fileStats.mtime,
          });
        }
      } catch {
        // Session directory might not exist
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to scan agent sessions:', error);
  }

  return sessions;
}

export async function parseSessionTranscript(filePath: string): Promise<Record<string, unknown>[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter((l) => l.trim());
    return lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((item): item is Record<string, unknown> => item !== null);
  } catch (error) {
    console.error('Failed to parse transcript:', filePath, error);
    return [];
  }
}

export async function aggregateUsageFromTranscripts(
  startDate: Date,
  endDate: Date
): Promise<TranscriptUsage[]> {
  const usageData: TranscriptUsage[] = [];

  try {
    const sessions = await getAllAgentSessions();

    for (const session of sessions) {
      // Skip if file is too old
      if (session.lastModified < startDate) continue;

      const messages = await parseSessionTranscript(session.filePath);

      for (const msg of messages) {
        // Look for API responses with usage data
        const usage = msg.usage as { total_tokens?: number; input_tokens?: number; output_tokens?: number; cost?: number } | undefined;

        if (usage && usage.total_tokens) {
          const timestamp = new Date(msg.timestamp as string || msg.ts as number || Date.now());

          // Filter by date range
          if (timestamp >= startDate && timestamp <= endDate) {
            usageData.push({
              model: (msg.model as string) || 'unknown',
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              totalTokens: usage.total_tokens || 0,
              cost: usage.cost || 0,
              timestamp,
              agent: session.agent,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to aggregate usage:', error);
  }

  return usageData;
}

// ============================================================================
// Handoffs
// ============================================================================

export async function getHandoffs(): Promise<HandoffFile[]> {
  const handoffsDir = path.join(homedir(), 'shared', 'handoffs');
  const handoffs: HandoffFile[] = [];

  try {
    const files = await readdir(handoffsDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(handoffsDir, file);
      const content = await readFile(filePath, 'utf-8');

      try {
        const handoff = JSON.parse(content) as HandoffFile['handoff'];
        handoffs.push({
          filename: file,
          handoff,
        });
      } catch {
        console.warn('Failed to parse handoff:', file);
      }
    }
  } catch (error) {
    console.error('Failed to read handoffs:', error);
  }

  return handoffs;
}

export async function getPendingHandoffs() {
  const allHandoffs = await getHandoffs();
  return allHandoffs
    .filter((h) => h.handoff.status === 'pending')
    .map((h) => ({
      id: h.filename.replace('.json', ''),
      spec: h.handoff.task || h.handoff.spec_path?.split('/').pop() || 'Unknown task',
      priority: h.handoff.priority || 5,
      from: h.handoff.from,
      to: h.handoff.to,
      createdAt: h.handoff.created_at,
    }))
    .sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// Crons
// ============================================================================

export async function fetchCronJobs(): Promise<{ jobs: Array<Record<string, unknown>> }> {
  try {
    const result = execSync('openclaw cron list --json', {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to fetch cron jobs:', error);
    return { jobs: [] };
  }
}

// ============================================================================
// Build Parser
// ============================================================================

export async function getRecentBuilds(agentId = 'dev', limit = 10): Promise<Record<string, unknown>[]> {
  const devSessionsDir = path.join(homedir(), '.openclaw', 'agents', agentId, 'sessions');
  const builds: Record<string, unknown>[] = [];

  try {
    const sessionFiles = await readdir(devSessionsDir);

    for (const file of sessionFiles) {
      if (!file.endsWith('.jsonl') || file.includes('.deleted.')) continue;

      const filePath = path.join(devSessionsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length === 0) continue;

      const messages = lines.map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      }).filter((item): item is Record<string, unknown> => item !== null);

      const firstMsg = messages[0];
      const lastMsg = messages[messages.length - 1];

      if (!firstMsg || !lastMsg) continue;

      // Only include completed sessions (older than 30 min)
      const lastTimestamp = new Date(lastMsg.timestamp as string || lastMsg.ts as number || 0);
      const ageMs = Date.now() - lastTimestamp.getTime();
      if (ageMs < 1800000) continue; // Skip if less than 30 min old

      const build = parseBuildFromSession(messages, file, agentId);
      if (build) {
        builds.push(build);
      }
    }
  } catch (error) {
    console.error('Failed to get builds:', error);
  }

  // Sort by completion time (most recent first)
  builds.sort((a, b) => {
    const aTime = new Date(a.completedAt as string).getTime();
    const bTime = new Date(b.completedAt as string).getTime();
    return bTime - aTime;
  });

  return builds.slice(0, limit);
}

function parseBuildFromSession(messages: Record<string, unknown>[], filename: string, agent: string): Record<string, unknown> | null {
  try {
    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];

    if (!firstMsg || !lastMsg) return null;

    // Get timestamps
    const startTime = new Date(firstMsg.timestamp as string || firstMsg.ts as number || Date.now());
    const endTime = new Date(lastMsg.timestamp as string || lastMsg.ts as number || Date.now());
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Extract spec/task from user messages
    let spec = '';
    let label = '';
    for (const msg of messages) {
      if (msg.type === 'user' || msg.role === 'user') {
        const content = typeof msg.content === 'string'
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)?.find((b: { type: string }) => b.type === 'text')?.text || '';

        if (content.includes('Spec:') || content.includes('Build')) {
          spec = content;
          label = content.substring(0, 50).replace(/\n/g, ' ');
          break;
        }
      }
    }

    // Determine status from completion messages
    let status: 'success' | 'error' | 'cancelled' = 'success';
    let commitHash: string | undefined;
    let commitUrl: string | undefined;

    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 10); i--) {
      const msg = messages[i];
      if (!msg) continue;

      if (msg.role === 'assistant' || msg.type === 'assistant') {
        const content = typeof msg.content === 'string'
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)?.find((b: { type: string }) => b.type === 'text')?.text || '';

        // Check for error indicators
        if (content.match(/error|failed|cannot|unable/i)) {
          status = 'error';
        }

        // Check for success indicators
        if (content.match(/complete|done|success|committed/i)) {
          status = 'success';
        }

        // Extract commit info
        const commitMatch = content.match(/commit ([a-f0-9]{7,40})/i);
        if (commitMatch) {
          commitHash = commitMatch[1];
        }

        const urlMatch = content.match(/(https:\/\/github\.com\/[^\/]+\/[^\/]+\/commit\/[a-f0-9]{40})/i);
        if (urlMatch) {
          commitUrl = urlMatch[1];
        }
      }
    }

    // Check for aborted/cancelled
    if (lastMsg.abortedLastRun || lastMsg.cancelled) {
      status = 'cancelled';
    }

    // Estimate lines changed from tokens
    const totalTokens = messages.reduce((sum, msg) => {
      const usage = msg.usage as { total_tokens?: number } | undefined;
      return sum + (usage?.total_tokens || 0);
    }, 0);
    const linesChanged = Math.floor(totalTokens * 0.4); // Heuristic

    // Get model from last assistant message
    let model = 'unknown';
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && (msg.role === 'assistant' || msg.type === 'assistant') && msg.model) {
        model = msg.model as string;
        break;
      }
    }

    return {
      id: filename.replace('.jsonl', ''),
      label: label || `Build ${filename.substring(0, 8)}`,
      spec,
      status,
      completedAt: endTime.toISOString(),
      duration,
      linesChanged,
      model,
      commitHash,
      commitUrl,
      agent,
    };
  } catch (error) {
    console.error('Failed to parse build:', error);
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function extractTaskFromKey(key: string): string | undefined {
  const keyParts = key.split(':');

  // For spawn sessions, extract task from key
  if (keyParts[1] === 'spawn' || keyParts[0] === 'spawn') {
    const taskId = keyParts[keyParts.length - 1];
    return taskId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // For main/cron, use generic labels
  if (keyParts.includes('main')) return 'Main session';
  if (keyParts.includes('cron')) return 'Scheduled task';

  return undefined;
}

export function estimateProgress(totalTokens: number): number | undefined {
  // Estimate based on tokens (rough heuristic)
  // Average task: ~50k tokens, progress = min(tokens/50000 * 100, 99)
  if (totalTokens > 0) {
    return Math.min(Math.floor((totalTokens / 50000) * 100), 99);
  }
  return undefined;
}
