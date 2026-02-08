'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MemoryChunkCard } from './MemoryChunkCard';

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    type: string;
    chunk_index: number;
    total_chunks: number;
  };
  created_at: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

interface MemorySearchProps {
  initialQuery?: string;
  onResultsChange?: (count: number) => void;
}

async function fetcher(url: string): Promise<SearchResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export function MemorySearch({ initialQuery = '', onResultsChange }: MemorySearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data, error, isLoading } = useSWR<SearchResponse>(
    debouncedQuery ? `/api/memory/search?q=${encodeURIComponent(debouncedQuery)}&limit=10` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      onSuccess: (data) => {
        onResultsChange?.(data.count);
      },
    }
  );

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search memories..."
          className="pl-10 pr-10 h-12 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          <span className="ml-2 text-sm text-zinc-500">Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            Failed to search memories. Please try again.
          </p>
        </div>
      )}

      {/* No Query State */}
      {!debouncedQuery && !isLoading && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            Search Your Memory
          </h3>
          <p className="text-sm text-zinc-500">
            Enter a query to search through indexed memories using semantic search.
          </p>
        </div>
      )}

      {/* No Results State */}
      {data && data.count === 0 && debouncedQuery && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500">
            No memories found for &quot;{debouncedQuery}&quot;
          </p>
        </div>
      )}

      {/* Results */}
      {data && data.count > 0 && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {data.count} result{data.count !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {data.results.map((result) => (
              <MemoryChunkCard
                key={result.id}
                id={result.id}
                content={result.content}
                similarity={result.similarity}
                metadata={result.metadata}
                created_at={result.created_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Import React for useEffect
import React from 'react';
