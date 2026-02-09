'use client';

import Link from 'next/link';
import { TranscriptMeta } from '@/types/transcripts';
import { MessageSquare, Hash, Clock, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionCardProps {
  session: TranscriptMeta;
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
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKindIcon(kind: TranscriptMeta['kind']): string {
  switch (kind) {
    case 'main':
      return '📱';
    case 'cron':
      return '⏰';
    case 'spawn':
      return '💻';
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

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link href={`/sessions/${session.sessionId}`} className="block group">
      <div className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-md transition-all bg-white hover:bg-zinc-50">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{getKindIcon(session.kind)}</span>
            <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
              {session.label || 'Untitled Session'}
            </h3>
            <Badge variant={getKindBadgeVariant(session.kind)} className="ml-2 flex-shrink-0">
              {session.kind}
            </Badge>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors flex-shrink-0 ml-2" />
        </div>

        {/* Session ID and Date */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-mono text-zinc-400 truncate">
            {session.sessionId.substring(0, 16)}...
          </span>
          <span className="text-zinc-500 whitespace-nowrap ml-2">
            {formatDate(session.startedAt)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{session.messageCount} msgs</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{formatTokens(session.tokenCount)} tokens</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{formatDuration(session.duration)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono truncate">{session.agent}</span>
          </div>
        </div>

        {/* Model Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-mono text-zinc-600">
            {session.model}
          </span>
        </div>

        {/* Preview */}
        <p className="text-sm text-zinc-600 line-clamp-2 bg-zinc-50 p-2 rounded">
          {session.lastMessage || 'No messages yet'}
        </p>
      </div>
    </Link>
  );
}
