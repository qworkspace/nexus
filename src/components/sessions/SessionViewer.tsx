'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { 
  Filter, 
  ArrowUpDown, 
  ScrollText, 
  MessageSquare, 
  Hash, 
  Clock,
  User,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TranscriptMeta } from '@/types/transcripts';

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

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKindIcon(kind: TranscriptMeta['kind']): string {
  switch (kind) {
    case 'main':
      return 'smartphone';
    case 'cron':
      return '⏰';
    case 'spawn':
      return 'monitor';
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

export function SessionViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'week', 'month'

  const { data, error, isLoading } = useSWR<SessionsResponse>('/api/transcripts', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
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
        const timeSinceStart = (now - sessionStart) / 1000; // in seconds
        const isActive = timeSinceStart < 3600; // Active if started within last hour
        
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
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
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Spawn Session
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-zinc-500 text-sm ml-9">
          Browse and search through all agent sessions with transcript viewer
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
      <div className="mb-6 space-y-4">
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
      <div className="mb-4 flex items-center justify-between">
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
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setAgentFilter('all');
                setDateFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <Link
              key={session.sessionId}
              href={`/transcripts/${session.sessionId}`}
              className="block group"
            >
              <div className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-sm transition-all bg-white">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{getKindIcon(session.kind)}</span>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {session.label || 'Untitled Session'}
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
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{session.messageCount} messages</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{formatTokens(session.tokenCount)} tokens</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-mono">{session.agent}</span>
                  </div>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs font-mono text-zinc-400">{session.model}</span>
                </div>

                {/* Preview */}
                <p className="text-sm text-zinc-600 line-clamp-2">
                  {session.lastMessage || 'No messages yet'}
                </p>

                {/* Session ID (for debugging) */}
                <p className="text-xs text-zinc-400 mt-2 font-mono">
                  ID: {session.sessionId.substring(0, 16)}...
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
