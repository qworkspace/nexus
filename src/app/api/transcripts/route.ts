import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface TranscriptMeta {
  sessionId: string;
  sessionKey: string;
  kind: 'main' | 'cron' | 'spawn';
  agent: string;
  model: string;
  messageCount: number;
  tokenCount: number;
  duration: number;
  startedAt: Date;
  lastMessage: string;
  label?: string;
}

interface MessageData {
  role?: string;
  content?: string | ContentBlock[];
  timestamp?: number;
  sessionKey?: string;
  model?: string;
  usage?: {
    totalTokens?: number;
  };
}

interface ContentBlock {
  type: string;
  text?: string;
}

async function getTranscriptMeta(sessionDir: string, filename: string): Promise<TranscriptMeta | null> {
  try {
    const filePath = join(sessionDir, filename);
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) return null;

    const messages: MessageData[] = lines.map(line => JSON.parse(line));
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    // Determine session metadata
    const sessionId = filename.replace('.jsonl', '');
    const sessionKey = firstMessage.sessionKey || `session:${sessionId}`;
    
    // Determine kind from session key
    let kind: 'main' | 'cron' | 'spawn' = 'spawn';
    if (sessionKey.includes('agent:main:main')) {
      kind = 'main';
    } else if (sessionKey.includes('cron')) {
      kind = 'cron';
    }

    // Extract agent name
    const agentMatch = sessionKey.match(/agent:([^:]+)/);
    const agent = agentMatch ? agentMatch[1] : 'Unknown';

    // Count tokens
    let tokenCount = 0;
    messages.forEach((msg) => {
      if (msg.usage?.totalTokens) {
        tokenCount += msg.usage.totalTokens;
      }
    });

    // Get model from last assistant message
    let model = 'unknown';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].model) {
        model = messages[i].model || 'unknown';
        break;
      }
    }

    // Calculate duration
    const startedAt = new Date(firstMessage.timestamp || Date.now());
    const endedAt = new Date(lastMessage.timestamp || Date.now());
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Extract last message text
    let lastMessageText = '';
    const lastContent = lastMessage.content;
    if (typeof lastContent === 'string') {
      lastMessageText = lastContent.substring(0, 100);
    } else if (Array.isArray(lastContent)) {
      const textBlock = lastContent.find((b) => b.type === 'text');
      if (textBlock && textBlock.text) {
        lastMessageText = textBlock.text.substring(0, 100);
      }
    }

    // Generate label
    let label = '';
    if (kind === 'main') {
      label = 'Main Session (Q ↔ PJ)';
    } else if (kind === 'cron') {
      const cronName = sessionKey.split(':').pop() || 'Cron Job';
      label = `Cron: ${cronName}`;
    } else {
      const taskMatch = lastMessageText.match(/Build|Fix|Create|Update|Add/i);
      if (taskMatch) {
        label = `${agent} Agent: ${lastMessageText.substring(0, 40)}`;
      } else {
        label = `${agent} Agent: ${sessionId.substring(0, 8)}`;
      }
    }

    return {
      sessionId,
      sessionKey,
      kind,
      agent,
      model,
      messageCount: messages.length,
      tokenCount,
      duration,
      startedAt,
      lastMessage: lastMessageText,
      label,
    };
  } catch (error) {
    console.error(`Error reading transcript ${filename}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const openclawDir = join(homedir(), '.openclaw', 'agents');
    
    // Get all agent directories
    const agentDirs = await readdir(openclawDir);
    const transcripts: TranscriptMeta[] = [];

    for (const agentDir of agentDirs) {
      const sessionsDir = join(openclawDir, agentDir, 'sessions');
      
      try {
        const sessionFiles = await readdir(sessionsDir);
        
        for (const file of sessionFiles) {
          if (file.endsWith('.jsonl')) {
            const meta = await getTranscriptMeta(sessionsDir, file);
            if (meta) {
              transcripts.push(meta);
            }
          }
        }
      } catch {
        // Directory might not exist, skip
        continue;
      }
    }

    // Sort by date (most recent first)
    transcripts.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    return NextResponse.json({
      source: 'live',
      data: {
        count: transcripts.length,
        transcripts,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to fetch transcripts:', error);

    // Import mock data as fallback
    const { mockSessions } = await import('@/data/mock-transcripts');
    
    return NextResponse.json({
      source: 'mock',
      error: error instanceof Error ? error.message : 'Failed to fetch transcripts',
      suggestion: 'Using mock data',
      data: {
        count: mockSessions.length,
        transcripts: mockSessions,
      },
    });
  }
}
