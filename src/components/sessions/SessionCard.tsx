'use client';

import Link from 'next/link';
import { TranscriptMeta } from '@/types/transcripts';
import { ArrowRight, MessageSquare } from 'lucide-react';

interface SessionCardProps {
  session: TranscriptMeta;
}

/**
 * Agent ID to display name mapping
 */
const AGENT_NAMES: Record<string, { name: string; model?: string }> = {
  'agent:main:main':        { name: 'Q', model: 'claude-opus-4.6' },
  'agent:dev:main':         { name: 'Dev', model: 'claude-opus-4.6' },
  'agent:research:main':   { name: 'Research', model: 'glm-4.7' },
  'agent:creative:main':    { name: 'Creative', model: 'claude-opus-4.6' },
  'agent:luna:main':        { name: 'Luna', model: 'claude-opus-4.6' },
};

const AGENT_WILDCARDS: Record<string, { name: string; model?: string }> = {
  'agent:dev:subagent':   { name: 'Dev Subagent', model: 'claude-sonnet-4.2' },
  'agent:research:subagent': { name: 'Research Subagent', model: 'glm-4.7' },
  'agent:creative:subagent': { name: 'Creative Subagent', model: 'claude-opus-4.6' },
};

function resolveAgentName(sessionId: string): { name: string; model: string } {
  if (AGENT_NAMES[sessionId]) {
    return {
      name: AGENT_NAMES[sessionId].name,
      model: AGENT_NAMES[sessionId].model || 'unknown',
    };
  }

  for (const [pattern, info] of Object.entries(AGENT_WILDCARDS)) {
    if (sessionId.startsWith(pattern + ':')) {
      return {
        name: info.name,
        model: info.model || 'unknown',
      };
    }
  }

  const parts = sessionId.split(':');
  const agentType = parts[1] || 'Unknown';
  const capitalizedName = agentType.charAt(0).toUpperCase() + agentType.slice(1);
  return {
    name: capitalizedName,
    model: 'unknown',
  };
}

function getSessionType(session: TranscriptMeta): { type: string; icon: string } {
  const agent = resolveAgentName(session.agent);
  const label = (session.label || '').toLowerCase();

  if (agent.name === 'Dev' || label.includes('build') || label.includes('code')) {
    return { type: 'BUILD', icon: '🛠️' };
  }

  if (agent.name === 'Research' || label.includes('research') || label.includes('analyz')) {
    return { type: 'RESEARCH', icon: '📊' };
  }

  if (agent.name === 'Q' || label.includes('chat') || label.includes('briefing')) {
    return { type: 'CHAT', icon: '💬' };
  }

  if (session.kind === 'cron') {
    return { type: 'MAINTENANCE', icon: '⚙️' };
  }

  if (agent.name === 'Creative') {
    return { type: 'CREATIVE', icon: '🎨' };
  }

  if (agent.name === 'Luna') {
    return { type: 'SUPPORT', icon: '💬' };
  }

  return { type: 'OTHER', icon: '📝' };
}

function getSessionTitle(session: TranscriptMeta): string {
  if (session.label && session.label.length > 0) {
    return session.label;
  }

  if (session.sessionKey.includes('/specs/')) {
    const match = session.sessionKey.match(/\/specs\/([^/]+)\.md/);
    if (match) {
      return match[1].replace(/-/g, ' ');
    }
  }

  const agent = resolveAgentName(session.agent);
  return `${agent.name} Session`;
}

function getSessionSummary(session: TranscriptMeta): string {
  if (session.lastMessage && session.lastMessage.length > 0) {
    return session.lastMessage.length > 80
      ? session.lastMessage.substring(0, 80) + '...'
      : session.lastMessage;
  }

  return 'No activity recorded';
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

function formatDurationFriendly(seconds: number): string {
  if (seconds < 60) {
    return '< 1 min';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatRelativeTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SessionCard({ session }: SessionCardProps) {
  const agent = resolveAgentName(session.agent);
  const sessionType = getSessionType(session);
  const title = getSessionTitle(session);
  const summary = getSessionSummary(session);
  const tokensFormatted = formatTokens(session.tokenCount);
  const duration = formatDurationFriendly(session.duration);
  const started = formatRelativeTime(session.startedAt);
  const statusIcon = session.duration > 0 ? '✅' : '⏳';

  return (
    <Link href={`/sessions/${session.sessionId}`} className="block group">
      <div className="bg-card border border-border rounded-xl p-4 hover:border-border hover:shadow-lg transition-all">
        {/* Header: Type + Title */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl flex-shrink-0">{sessionType.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">{sessionType.type}</h3>
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          </div>
          <span className="text-sm flex-shrink-0">{statusIcon}</span>
        </div>

        {/* Summary */}
        {summary && summary !== 'No activity recorded' && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {summary}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground mb-3">
          <div>
            <span className="text-muted-foreground">Agent:</span> {agent.name}
          </div>
          <div>
            <span className="text-muted-foreground">Model:</span> {agent.model}
          </div>
          <div>
            <span className="text-muted-foreground">Started:</span> {started}
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span> {duration}
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Messages:</span> {session.messageCount}
            {' • '}
            <span className="text-muted-foreground">Tokens:</span> {tokensFormatted}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span>View transcript</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
