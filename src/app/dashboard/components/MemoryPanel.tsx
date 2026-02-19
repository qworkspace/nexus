"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Search, Tag, TrendingUp } from "lucide-react";
import useSWR from "swr";

interface MemoryStats {
  source: 'live' | 'mock' | 'error';
  totalMemories: number;
  model: string;
  lastUpdated: string;
  indexPath: string;
  sources: Record<string, number>;
  totalFiles: number;
  error?: string;
}

interface Topic {
  term: string;
  count: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Memory {
  id: string;
  content: string;
  source: string;
  relevance: number;
}

async function fetcher(url: string): Promise<MemoryStats> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function MemoryPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useSWR<MemoryStats>(
    '/api/memory/stats',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const totalMemories = data?.totalMemories || 0;
  const sources = data?.sources || {};
  const totalFiles = data?.totalFiles || 0;

  // Mock topics (would come from API)
  const mockTopics: Topic[] = [
    { term: "agents", count: 12 },
    { term: "mission-control", count: 8 },
    { term: "crypto", count: 6 },
    { term: "api", count: 5 },
    { term: "development", count: 4 },
    { term: "testing", count: 3 },
  ];

  // Calculate context usage (mock)
  const contextUsage = {
    current: 45000,
    max: 200000,
    percentage: 22.5,
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // Would navigate to memory search page with query
    window.location.href = `/memory?search=${encodeURIComponent(searchQuery)}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const topSources = Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([source, count]) => ({
      name: source.split('/').pop() || source,
      count,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">MEMORY & CONTEXT</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Context Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-zinc-400" />
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Context Usage
                </p>
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {(contextUsage.current / 1000).toFixed(0)}k / {(contextUsage.max / 1000).toFixed(0)}k tokens
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
              <div
                className="bg-zinc-500 h-2 rounded-full transition-all"
                style={{ width: `${contextUsage.percentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {contextUsage.percentage.toFixed(1)}% used
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Memories</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {totalMemories}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Sources</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {totalFiles}
              </p>
            </div>
          </div>

          {/* Top Topics */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Tag className="h-3 w-3 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Top Topics
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockTopics.map((topic) => (
                <span
                  key={topic.term}
                  className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs"
                >
                  {topic.term}
                  <span className="ml-1 text-zinc-500 dark:text-zinc-400">({topic.count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Top Sources */}
          {topSources.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="h-3 w-3 text-zinc-400" />
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Top Sources
                </p>
              </div>
              <div className="space-y-1">
                {topSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">
                      {source.name}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      {source.count} memories
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Search */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1 mb-2">
              <Search className="h-3 w-3 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Quick Search
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSearch}
                className="h-8"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
