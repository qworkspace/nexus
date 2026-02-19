'use client';

import { Message, ContentBlock } from '@/types/transcripts';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { User, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderContent(content: ContentBlock[]) {
  return content.map((block, idx) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={idx} className="prose prose-sm prose-zinc max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.text}
            </ReactMarkdown>
          </div>
        );
      case 'thinking':
        return <ThinkingBlock key={idx} content={block.thinking} />;
      case 'toolCall':
        return <ToolCallBlock key={idx} name={block.name} input={block.input} />;
      case 'toolResult':
        return (
          <ToolCallBlock
            key={idx}
            name={block.content}
            input={{ result: block.content }}
            isResult
            isError={block.isError}
          />
        );
      default:
        return null;
    }
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const contentArray = typeof message.content === 'string'
    ? [{ type: 'text' as const, text: message.content }]
    : message.content;

  return (
    <div
      className={`rounded-lg p-4 ${
        isSystem
          ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
          : isUser
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-white border border-zinc-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {isSystem ? (
          <AlertCircle className="w-4 h-4 text-yellow-600" />
        ) : isUser ? (
          <User className="w-4 h-4 text-blue-600" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={`text-xs font-medium ${
          isSystem
            ? 'text-yellow-900'
            : isUser
            ? 'text-blue-900'
            : 'text-zinc-900'
        }`}>
          {isSystem ? 'System' : isUser ? 'User' : 'Assistant'}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(message.timestamp)}
        </span>
        {message.usage && (
          <span className="ml-auto text-xs text-muted-foreground">
            {message.usage.totalTokens} tokens
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`text-sm ${
        isSystem ? 'text-yellow-900 italic' : isUser ? 'text-zinc-900' : 'text-zinc-800'
      }`}>
        {renderContent(contentArray)}
      </div>
    </div>
  );
}
