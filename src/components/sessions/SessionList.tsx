'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { SessionCard } from './SessionCard';
import { TranscriptMeta } from '@/types/transcripts';
import { 
  ArrowUpDown, 
  ScrollText, 
  Loader2,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SessionsResponse {
  source: 'live' | 'mock';
  data: {
    count: number;
    transcripts: TranscriptMeta[];
  };
  error?: string;
  suggestion?: string;
}

type FilterType = 'all' | 'main' | 'cron' | 'spawn';
type SortType = 'recent' | 'oldest' | 'tokens' | 'duration';
type StatusFilter = 'all' | 'active' | 'completed';

interface SessionListProps {
  showTitle?: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Agent ID to display name mapping
const AGENT_NAMES: Record<string, { name: string; model?: string }> = {
  'agent:main:main':        { name: 'Q', model: 'claude-opus-4.6' },
  'agent:dev:main':         { name: 'Dev', model: 'claude-opus-4.6' },
  'agent:research:main':   { name: 'Research', model: 'glm-4.7' },
  'agent:creative:main':    { name: 'Creative', model: 'claude-opus-4.6' },
  'agent:luna:main':        { name: 'Luna', model: 'claude-opus-4.6' },
};

// Wildcard patterns for subagent resolution
const AGENT_WILDCARDS: Record<string, { name: string; model?: string }> = {
  'agent:dev:subagent':   { name: 'Dev Subagent', model: 'claude-sonnet-4.2' },
  'agent:research:subagent': { name: 'Research Subagent', model: 'glm-4.7' },
  'agent:creative:subagent': { name: 'Creative Subagent', model: 'claude-opus-4.6' },
};

/**
 * Resolve agent display name from session ID
 * Handles exact matches and wildcard patterns for subagents
 */
export function resolveAgentName(sessionId: string): { name: string; model: string } {
  // Check exact match first
  if (AGENT_NAMES[sessionId]) {
    return {
      name: AGENT_NAMES[sessionId].name,
      model: AGENT_NAMES[sessionId].model || 'unknown',
    };
  }

  // Check wildcard match (e.g., "agent:dev:subagent:*")
  for (const [pattern, info] of Object.entries(AGENT_WILDCARDS)) {
    if (sessionId.startsWith(pattern + ':')) {
      return {
        name: info.name,
        model: info.model || 'unknown',
      };
    }
  }

  // Fallback: extract type from session ID
  const parts = sessionId.split(':');
  const agentType = parts[1] || 'Unknown';
  const capitalizedName = agentType.charAt(0).toUpperCase() + agentType.slice(1);
  return {
    name: capitalizedName,
    model: 'unknown',
  };
}

/**
 * Determine session type based on agent and metadata
 * Returns type label and icon key
 */
export function getSessionType(session: TranscriptMeta): { type: string; icon: string } {
  const agent = resolveAgentName(session.agent);
  const label = (session.label || '').toLowerCase();

  // Dev agent = BUILD
  if (agent.name === 'Dev' || label.includes('build') || label.includes('code')) {
    return { type: 'BUILD', icon: 'build' };
  }

  // Research agent = RESEARCH
  if (agent.name === 'Research' || label.includes('research') || label.includes('analyz')) {
    return { type: 'RESEARCH', icon: 'research' };
  }

  // Q agent = CHAT
  if (agent.name === 'Q' || label.includes('chat') || label.includes('briefing')) {
    return { type: 'CHAT', icon: 'chat' };
  }

  // Cron sessions = MAINTENANCE
  if (session.kind === 'cron') {
    return { type: 'MAINTENANCE', icon: 'maintenance' };
  }

  // Creative agent = CREATIVE
  if (agent.name === 'Creative') {
    return { type: 'CREATIVE', icon: 'creative' };
  }

  // Luna agent = SUPPORT
  if (agent.name === 'Luna') {
    return { type: 'SUPPORT', icon: 'support' };
  }

  // Default
  return { type: 'OTHER', icon: 'other' };
}

/**
 * Extract meaningful title from session metadata
 * Priority: label > spec name > session ID fallback
 */
export function getSessionTitle(session: TranscriptMeta): string {
  // From label
  if (session.label && session.label.length > 0) {
    return session.label;
  }

  // Extract spec name from session key if present
  if (session.sessionKey.includes('/specs/')) {
    const match = session.sessionKey.match(/\/specs\/([^/]+)\.md/);
    if (match) {
      return match[1].replace(/-/g, ' ');
    }
  }

  // Fallback to generic title
  const agent = resolveAgentName(session.agent);
  return `${agent.name} Session`;
}

/**
 * Get one-line summary of session activity
 */
export function getSessionSummary(session: TranscriptMeta): string {
  // Use lastMessage as summary (it's already a preview)
  if (session.lastMessage && session.lastMessage.length > 0) {
    return session.lastMessage.length > 80
      ? session.lastMessage.substring(0, 80) + '...'
      : session.lastMessage;
  }

  return 'No activity recorded';
}

/**
 * Format relative time (Today, Yesterday, X days ago)
 */
export function formatRelativeTime(date: Date): string {
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

/**
 * Format duration in human-readable format
 */
export function formatDurationFriendly(seconds: number): string {
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

export function SessionList({ showTitle = true }: SessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data, error, isLoading } = useSWR<SessionsResponse>('/api/transcripts', fetcher, {
    refreshInterval: 30000,
  });

  // Extract unique agents for filter
  const availableAgents = useMemo(() => {
    if (!data?.data?.transcripts) return [];
    const agents = new Set(data.data.transcripts.map(s => s.agent));
    return Array.from(agents).sort();
  }, [data]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    if (!data?.data?.transcripts) return [];

    let filtered = [...data.data.transcripts];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.kind === filterType);
    }

    // Filter by agent
    if (agentFilter !== 'all') {
      filtered = filtered.filter(s => s.agent === agentFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.startedAt);
        switch (dateFilter) {
          case 'today':
            return sessionDate >= today;
          case 'week':
            return sessionDate >= weekAgo;
          case 'month':
            return sessionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by status (duration-based heuristic for "active")
    if (statusFilter !== 'all') {
      const now = Date.now();
      filtered = filtered.filter(s => {
        const sessionStart = new Date(s.startedAt).getTime();
        const timeSinceStart = (now - sessionStart) / 1000;
        const isActive = timeSinceStart < 3600;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.label?.toLowerCase().includes(query) ||
        s.lastMessage.toLowerCase().includes(query) ||
        s.agent.toLowerCase().includes(query) ||
        s.sessionId.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortType) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        break;
      case 'tokens':
        filtered.sort((a, b) => b.tokenCount - a.tokenCount);
        break;
      case 'duration':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
    }

    return filtered;
  }, [data, filterType, agentFilter, dateFilter, statusFilter, searchQuery, sortType]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setAgentFilter('all');
    setDateFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {showTitle && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ScrollText className="w-6 h-6 text-zinc-600" />
              <h1 className="text-2xl font-semibold text-zinc-900">Session Browser</h1>
              {data?.source === 'live' && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Live
                </Badge>
              )}
              {data?.source === 'mock' && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Mock Data
                </Badge>
              )}
            </div>
          </div>
          <p className="text-zinc-500 text-sm ml-9">
            Browse and search through all agent sessions with transcript viewer
          </p>
        </div>
      )}

      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search sessions by label, message, agent, or session ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 font-medium">Type:</span>
            <div className="flex gap-1">
              {(['all', 'main', 'cron', 'spawn'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filterType === type
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by agent */}
          {availableAgents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 font-medium">Agent:</span>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="px-3 py-1 text-sm rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-none outline-none cursor-pointer"
              >
                <option value="all">All</option>
                {availableAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 font-medium">Date:</span>
            <div className="flex gap-1">
              {(['all', 'today', 'week', 'month'] as const).map((date) => (
                <button
                  key={date}
                  onClick={() => setDateFilter(date)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    dateFilter === date
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {date.charAt(0).toUpperCase() + date.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 font-medium">Status:</span>
            <div className="flex gap-1">
              {(['all', 'active', 'completed'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 font-medium">Sort by:</span>
          <div className="flex gap-1">
            {(['recent', 'oldest', 'tokens', 'duration'] as SortType[]).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortType(sort)}
                className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  sortType === sort
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count and data source info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading sessions...
            </span>
          ) : error ? (
            <span className="text-red-600">Error loading sessions</span>
          ) : (
            <>
              Showing {filteredSessions.length} of {data?.data?.count || 0} session
              {filteredSessions.length !== 1 ? 's' : ''}
            </>
          )}
        </p>
        {data?.error && (
          <p className="text-xs text-amber-600">{data.error}</p>
        )}
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-zinc-400" />
            <p className="text-zinc-500">Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Failed to load sessions</p>
            <p className="text-sm text-zinc-500">Please check console for details</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <ScrollText className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
            <p className="text-zinc-500">No sessions match your filters</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
