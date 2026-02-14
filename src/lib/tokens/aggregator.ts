/**
 * Token Aggregation Logic
 * Parse session transcripts and aggregate token usage data
 */

import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import {
  SessionMessage,
  AggregatedData,
  DailyAggregation,
  ModelAggregation,
  ProviderAggregation,
  SessionTypeAggregation,
} from './types';

// Session file info
interface SessionFileInfo {
  agent: string;
  sessionId: string;
  filePath: string;
  lastModified: Date;
}

// ============================================================================
// Session File Scanning
// ============================================================================

/**
 * Get all session files from all agents
 */
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
  } catch {
    // Silently fail - will return empty list
  }

  return sessions;
}

/**
 * Parse session transcript from JSONL file
 */
export async function parseSessionTranscript(
  filePath: string
): Promise<SessionMessage[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter((l) => l.trim());
    return lines.map((line) => {
      try {
        return JSON.parse(line) as SessionMessage;
      } catch {
        return null;
      }
    }).filter((item): item is SessionMessage => item !== null);
  } catch {
    return [];
  }
}

/**
 * Extract agent and session type from session key (filename)
 */
function parseSessionKey(sessionId: string): {
  agentType: string;
  sessionType: 'main' | 'cron' | 'subagent';
  label: string;
} {
  // Session ID format examples:
  // - "agent:main:main" -> main session
  // - "agent:main:subagent:xxx" -> subagent session
  // - "agent:main:cron:xxx" -> cron job

  const parts = sessionId.split(':');

  if (parts.includes('cron')) {
    return {
      agentType: parts[1] || 'main',
      sessionType: 'cron',
      label: parts[parts.length - 1]?.replace(/-/g, ' ') || 'Cron Job',
    };
  }

  if (parts.includes('subagent')) {
    return {
      agentType: parts[1] || 'main',
      sessionType: 'subagent',
      label: parts[parts.length - 1]?.replace(/-/g, ' ') || 'Subagent',
    };
  }

  return {
    agentType: parts[1] || 'main',
    sessionType: 'main',
    label: 'Main Session',
  };
}

// ============================================================================
// Token Aggregation
// ============================================================================

/**
 * Aggregate token usage from all sessions within a date range
 */
export async function aggregateTokenUsage(
  startDate: Date,
  endDate: Date
): Promise<AggregatedData> {
  const aggregated: AggregatedData = {
    byDay: new Map(),
    byModel: new Map(),
    byProvider: new Map(),
    bySessionType: new Map(),
    bySession: new Map(),
  };

  const sessions = await getAllAgentSessions();

  for (const session of sessions) {
    // Skip if file is too old
    if (session.lastModified < startDate) continue;

    const messages = await parseSessionTranscript(session.filePath);
    const sessionKey = parseSessionKey(session.sessionId);

    for (const msg of messages) {
      // Look for assistant messages with usage data
      const usage = msg.message?.usage;
      const model = msg.message?.model;
      const provider = msg.message?.provider;

      if (!usage || !usage.totalTokens || usage.totalTokens === 0) continue;
      if (!model) continue;

      const timestamp = new Date(msg.timestamp || Date.now());

      // Filter by date range
      if (timestamp < startDate || timestamp > endDate) continue;

      const dateKey = timestamp.toISOString().split('T')[0];
      const modelKey = `${provider}:${model}`;
      const sessionTypeKey = sessionKey.sessionType;

      // Get values with defaults
      const input = usage.input || 0;
      const output = usage.output || 0;
      const cacheRead = usage.cacheRead || 0;
      const cacheWrite = usage.cacheWrite || 0;
      const totalTokens = usage.totalTokens;

      const inputCost = usage.cost?.input || 0;
      const outputCost = usage.cost?.output || 0;
      const cacheReadCost = usage.cost?.cacheRead || 0;
      const cacheWriteCost = usage.cost?.cacheWrite || 0;
      const totalCost = usage.cost?.total || 0;

      // Aggregate by day
      const dayData = aggregated.byDay.get(dateKey) || createEmptyDailyAggregation(dateKey);
      dayData.input += input;
      dayData.output += output;
      dayData.cacheRead += cacheRead;
      dayData.cacheWrite += cacheWrite;
      dayData.totalTokens += totalTokens;
      dayData.totalCost += totalCost;
      dayData.inputCost += inputCost;
      dayData.outputCost += outputCost;
      dayData.cacheReadCost += cacheReadCost;
      dayData.cacheWriteCost += cacheWriteCost;
      dayData.totalRequests += 1;
      aggregated.byDay.set(dateKey, dayData);

      // Aggregate by model
      const modelData = aggregated.byModel.get(modelKey) || createEmptyModelAggregation(model, provider || 'unknown');
      modelData.input += input;
      modelData.output += output;
      modelData.cacheRead += cacheRead;
      modelData.cacheWrite += cacheWrite;
      modelData.totalTokens += totalTokens;
      modelData.totalCost += totalCost;
      modelData.inputCost += inputCost;
      modelData.outputCost += outputCost;
      modelData.cacheReadCost += cacheReadCost;
      modelData.cacheWriteCost += cacheWriteCost;
      modelData.requestCount += 1;
      aggregated.byModel.set(modelKey, modelData);

      // Aggregate by provider
      const providerData = aggregated.byProvider.get(provider || 'unknown') || createEmptyProviderAggregation(provider || 'unknown');
      providerData.input += input;
      providerData.output += output;
      providerData.cacheRead += cacheRead;
      providerData.cacheWrite += cacheWrite;
      providerData.totalTokens += totalTokens;
      providerData.totalCost += totalCost;
      providerData.inputCost += inputCost;
      providerData.outputCost += outputCost;
      providerData.cacheReadCost += cacheReadCost;
      providerData.cacheWriteCost += cacheWriteCost;
      providerData.requestCount += 1;
      aggregated.byProvider.set(provider || 'unknown', providerData);

      // Aggregate by session type
      const typeData = aggregated.bySessionType.get(sessionTypeKey) || createEmptySessionTypeAggregation(sessionTypeKey);
      typeData.input += input;
      typeData.output += output;
      typeData.cacheRead += cacheRead;
      typeData.cacheWrite += cacheWrite;
      typeData.totalTokens += totalTokens;
      typeData.totalCost += totalCost;
      typeData.inputCost += inputCost;
      typeData.outputCost += outputCost;
      typeData.cacheReadCost += cacheReadCost;
      typeData.cacheWriteCost += cacheWriteCost;
      typeData.requestCount += 1;
      aggregated.bySessionType.set(sessionTypeKey, typeData);

      // Aggregate by session
      const sessionData = aggregated.bySession.get(session.sessionId) || {
        sessionId: session.sessionId,
        agentType: sessionKey.agentType,
        sessionType: sessionKey.sessionType,
        label: sessionKey.label,
        totalTokens: 0,
        totalCost: 0,
        timestamp: timestamp.toISOString(),
      };
      sessionData.totalTokens += totalTokens;
      sessionData.totalCost += totalCost;
      // Update timestamp to the latest message
      if (timestamp > new Date(sessionData.timestamp)) {
        sessionData.timestamp = timestamp.toISOString();
      }
      aggregated.bySession.set(session.sessionId, sessionData);
    }
  }

  return aggregated;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createEmptyDailyAggregation(date: string): DailyAggregation {
  return {
    date,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    totalRequests: 0,
  };
}

function createEmptyModelAggregation(model: string, provider: string): ModelAggregation {
  return {
    model,
    provider,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    requestCount: 0,
  };
}

function createEmptyProviderAggregation(provider: string): ProviderAggregation {
  return {
    provider,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    requestCount: 0,
  };
}

function createEmptySessionTypeAggregation(type: 'main' | 'cron' | 'subagent'): SessionTypeAggregation {
  return {
    type,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    requestCount: 0,
  };
}

export type { AggregatedData };
