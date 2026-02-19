'use client';

import React from 'react';
import Link from 'next/link';
import { TranscriptMeta } from '@/types/transcripts';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Timer, Monitor } from 'lucide-react';

interface TranscriptListProps {
  sessions: TranscriptMeta[];
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getKindIcon(kind: TranscriptMeta['kind']): React.ReactNode {
  switch (kind) {
    case 'main': return <Smartphone size={16} className="text-muted-foreground" />;
    case 'cron': return <Timer size={16} className="text-muted-foreground" />;
    case 'spawn': return <Monitor size={16} className="text-muted-foreground" />;
    default: return <Monitor size={16} className="text-muted-foreground" />;
  }
}

function getKindBadgeVariant(kind: TranscriptMeta['kind']): 'default' | 'secondary' | 'outline' {
  switch (kind) {
    case 'main':
      return 'default';
    case 'cron':
      return 'secondary';
    case 'spawn':
      return 'outline';
  }
}

export function TranscriptList({ sessions }: TranscriptListProps) {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link
          key={session.sessionId}
          href={`/transcripts/${session.sessionId}`}
          className="block group"
        >
          <div className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-sm transition-all bg-white">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center">{getKindIcon(session.kind)}</span>
                <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                  {session.label}
                </h3>
                <Badge variant={getKindBadgeVariant(session.kind)} className="ml-2">
                  {session.kind}
                </Badge>
              </div>
              <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                {formatDate(session.startedAt)}
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-2">
              <span>{session.messageCount} messages</span>
              <span>•</span>
              <span>{formatTokens(session.tokenCount)} tokens</span>
              <span>•</span>
              <span>{formatDuration(session.duration)}</span>
              <span>•</span>
              <span className="font-mono">{session.agent}</span>
              <span>•</span>
              <span className="font-mono text-zinc-400">{session.model}</span>
            </div>

            {/* Preview */}
            <p className="text-sm text-zinc-600 line-clamp-1">
              {session.lastMessage}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
