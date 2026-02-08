'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Brain, FolderTree, BarChart3, Search, Loader2 } from 'lucide-react';
import { MemorySearch, MemoryStatsCard } from '@/components/memory';

interface SourceFile {
  path: string;
  name: string;
  chunkCount: number;
  lastModified: string;
}

interface SourcesResponse {
  files: SourceFile[];
  totalFiles: number;
}

async function fetchSources(): Promise<SourcesResponse> {
  const res = await fetch('/api/memory/sources');
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export default function MemoryPage() {
  const [view, setView] = useState<'search' | 'browser' | 'stats'>('search');

  const { data: sourcesData, isLoading: sourcesLoading } = useSWR<SourcesResponse>(
    view === 'browser' ? '/api/memory/sources' : null,
    fetchSources
  );

  const handleResultsChange = () => {
    // Could update a state to show result count in header
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-zinc-600" />
          <h1 className="text-2xl font-semibold text-zinc-900">Memory</h1>
        </div>
        <p className="text-zinc-500 text-sm ml-9">
          Semantic search and browse through Q&apos;s indexed memories
        </p>
      </div>

      {/* View Tabs */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
          <button
            onClick={() => setView('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'search'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={() => setView('browser')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'browser'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Browse Files
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'stats'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {view === 'search' && (
          <div className="max-w-3xl">
            <MemorySearch onResultsChange={handleResultsChange} />
          </div>
        )}

        {view === 'browser' && (
          <div className="border border-zinc-200 rounded-lg bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-zinc-600" />
              <h3 className="font-semibold text-zinc-900">Source Files</h3>
            </div>

            {sourcesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                <span className="ml-2 text-sm text-zinc-500">Loading sources...</span>
              </div>
            ) : sourcesData && sourcesData.files.length > 0 ? (
              <div className="space-y-2">
                {sourcesData.files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate font-mono">
                        {file.path}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-semibold text-zinc-700">
                        {file.chunkCount}
                      </p>
                      <p className="text-xs text-zinc-500">chunks</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderTree className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-sm text-zinc-500">No source files indexed</p>
              </div>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="max-w-lg">
            <MemoryStatsCard />
          </div>
        )}
      </div>
    </div>
  );
}
