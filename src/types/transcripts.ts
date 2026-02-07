export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string }
  | { type: 'toolCall'; name: string; input: Record<string, unknown> }
  | { type: 'toolResult'; content: string; isError?: boolean; toolUseId?: string };

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TranscriptMeta {
  sessionId: string;
  sessionKey: string;
  kind: 'main' | 'cron' | 'spawn';
  agent: string;
  model: string;
  messageCount: number;
  tokenCount: number;
  duration: number; // in seconds
  startedAt: Date;
  lastMessage: string;
  label?: string;
}

export interface Transcript extends TranscriptMeta {
  messages: Message[];
}
