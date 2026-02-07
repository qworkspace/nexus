'use client';

import { useState } from 'react';
import { TranscriptList } from '@/components/transcripts/TranscriptList';
import { mockSessions } from '@/data/mock-transcripts';
import { Filter, ArrowUpDown, ScrollText } from 'lucide-react';
import { Input } from '@/components/ui/input';

type FilterType = 'all' | 'main' | 'cron' | 'spawn';
type SortType = 'recent' | 'oldest' | 'tokens' | 'duration';

export default function TranscriptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');

  // For now, use all sessions with client-side filtering
  let filtered = [...mockSessions];

  // Filter by type
  if (filterType !== 'all') {
    filtered = filtered.filter(s => s.kind === filterType);
  }

  // Filter by search (this would be done on the client in real usage)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.label?.toLowerCase().includes(query) ||
      s.lastMessage.toLowerCase().includes(query) ||
      s.agent.toLowerCase().includes(query)
    );
  }

  // Sort
  switch (sortType) {
    case 'recent':
      filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      break;
    case 'oldest':
      filtered.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
      break;
    case 'tokens':
      filtered.sort((a, b) => b.tokenCount - a.tokenCount);
      break;
    case 'duration':
      filtered.sort((a, b) => b.duration - a.duration);
      break;
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ScrollText className="w-6 h-6 text-zinc-600" />
          <h1 className="text-2xl font-semibold text-zinc-900">Transcripts</h1>
        </div>
        <p className="text-zinc-500 text-sm ml-9">
          Browse and search through all conversation sessions
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search transcripts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Filter:</span>
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

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-zinc-500">Sort:</span>
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
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Showing {filtered.length} session{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Session List */}
      <TranscriptList sessions={filtered} />
    </div>
  );
}
