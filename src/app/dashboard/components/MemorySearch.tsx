"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, FileText } from "lucide-react";

interface MemoryResult {
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
  results: MemoryResult[];
  query: string;
  count: number;
}

interface MemorySearchProps {
  initialQuery?: string;
}

export function MemorySearch({ initialQuery = "" }: MemorySearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      const doInitialSearch = async () => {
        setLoading(true);
        setSearched(true);
        try {
          const response = await fetch(
            `/api/memory/search?q=${encodeURIComponent(initialQuery)}&limit=10`
          );
          if (!response.ok) {
            throw new Error('Search failed');
          }
          const data: SearchResponse = await response.json();
          setResults(data.results);
        } catch (err) {
          console.error('Search error:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };
      doInitialSearch();
    }
  }, [initialQuery]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/memory/search?q=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const formatSimilarity = (similarity: number): string => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  const getSourceName = (source: string): string => {
    const parts = source.split('/');
    return parts[parts.length - 1] || source;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
        {(query || searched) && (
          <Button variant="ghost" onClick={clearSearch}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((result) => (
                <Card key={result.id} className="p-4">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {getSourceName(result.metadata.source)}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-full font-medium">
                        {formatSimilarity(result.similarity)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-3">
                      <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                        {result.content.slice(0, 500)}
                        {result.content.length > 500 && "\n..."}
                      </pre>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        Chunk {result.metadata.chunk_index + 1} of {result.metadata.total_chunks}
                      </span>
                      <span>
                        {new Date(result.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          Searching memory...
        </div>
      )}
    </div>
  );
}
