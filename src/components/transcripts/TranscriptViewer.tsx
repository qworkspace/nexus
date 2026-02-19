'use client';

import { useState } from 'react';
import { Transcript } from '@/types/transcripts';
import { MessageBubble } from './MessageBubble';
import { ArrowLeft, Search, MessageSquare, Hash, Clock } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface TranscriptViewerProps {
  transcript: Transcript;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = searchQuery
    ? transcript.messages.filter(msg => {
        const content = typeof msg.content === 'string'
          ? msg.content
          : msg.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        return content.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : transcript.messages;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white p-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/transcripts">
            <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-zinc-900">
              {transcript.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(transcript.startedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{transcript.messageCount} messages</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span>{formatTokens(transcript.tokenCount)} tokens</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(transcript.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-mono">
              {transcript.model}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in this transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {filteredMessages.length} of {transcript.messageCount} messages
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4 bg-zinc-50">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No messages match your search
          </div>
        ) : (
          filteredMessages.map((message, idx) => (
            <MessageBubble key={idx} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
