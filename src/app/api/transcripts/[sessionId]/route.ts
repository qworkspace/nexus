import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ContentBlock {
  type: string;
  text?: string;
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

interface Transcript {
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
  messages: Message[];
}

async function findSessionFile(sessionId: string): Promise<string | null> {
  try {
    const openclawDir = join(homedir(), '.openclaw', 'agents');
    const agentDirs = await readdir(openclawDir);

    for (const agentDir of agentDirs) {
      const sessionsDir = join(openclawDir, agentDir, 'sessions');
      
      try {
        const sessionFiles = await readdir(sessionsDir);
        const targetFile = `${sessionId}.jsonl`;
        
        if (sessionFiles.includes(targetFile)) {
          return join(sessionsDir, targetFile);
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding session file:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const filePath = await findSessionFile(sessionId);

    if (!filePath) {
      // Try mock data
      const { getMockTranscript } = await import('@/data/mock-transcripts');
      const mockTranscript = getMockTranscript(sessionId);
      
      if (!mockTranscript) {
        return NextResponse.json(
          { error: 'Transcript not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        source: 'mock',
        data: mockTranscript,
      });
    }

    // Read the JSONL file
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'Empty transcript' },
        { status: 404 }
      );
    }

    const messages: Message[] = lines.map(line => JSON.parse(line));
    const messagesData: MessageData[] = lines.map(line => JSON.parse(line));
    const firstMessage = messagesData[0];
    const lastMessage = messagesData[messagesData.length - 1];

    // Build metadata
    const sessionKey = firstMessage.sessionKey || `session:${sessionId}`;
    
    let kind: 'main' | 'cron' | 'spawn' = 'spawn';
    if (sessionKey.includes('agent:main:main')) {
      kind = 'main';
    } else if (sessionKey.includes('cron')) {
      kind = 'cron';
    }

    const agentMatch = sessionKey.match(/agent:([^:]+)/);
    const agent = agentMatch ? agentMatch[1] : 'Unknown';

    let tokenCount = 0;
    messagesData.forEach((msg) => {
      if (msg.usage?.totalTokens) {
        tokenCount += msg.usage.totalTokens;
      }
    });

    let model = 'unknown';
    for (let i = messagesData.length - 1; i >= 0; i--) {
      if (messagesData[i].role === 'assistant' && messagesData[i].model) {
        model = messagesData[i].model || 'unknown';
        break;
      }
    }

    const startedAt = new Date(firstMessage.timestamp || Date.now());
    const endedAt = new Date(lastMessage.timestamp || Date.now());
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

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

    let label = '';
    if (kind === 'main') {
      label = 'Main Session (Q ↔ PJ)';
    } else if (kind === 'cron') {
      const cronName = sessionKey.split(':').pop() || 'Cron Job';
      label = `Cron: ${cronName}`;
    } else {
      label = `${agent} Agent: ${sessionId.substring(0, 8)}`;
    }

    const transcript: Transcript = {
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
      messages,
    };

    return NextResponse.json({
      source: 'live',
      data: transcript,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch transcript:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch transcript',
      },
      { status: 500 }
    );
  }
}
