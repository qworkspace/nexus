'use client';

import useSWR from 'swr';
import { Brain, Database, FileText, Clock } from 'lucide-react';

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

function formatSize(memories: number): string {
  // Rough estimate: ~4 bytes per character in content, plus metadata
  const bytes = memories * 2000;
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MemoryStatsCard() {
  const { data, error, isLoading } = useSWR<MemoryStats>('/api/memory/stats', {
    refreshInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="border border-zinc-200 rounded-lg bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-zinc-100 rounded"></div>
            <div className="h-16 bg-zinc-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-zinc-900">Memory Stats</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Chunks */}
        <div className="flex items-start gap-3">
          <Database className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-2xl font-semibold text-zinc-900">
              {data.totalMemories}
            </p>
            <p className="text-xs text-muted-foreground">chunks indexed</p>
          </div>
        </div>

        {/* Total Files */}
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-2xl font-semibold text-zinc-900">
              {data.totalFiles}
            </p>
            <p className="text-xs text-muted-foreground">source files</p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
        {/* Model */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Embedding model</span>
          <span className="font-mono text-zinc-700">{data.model}</span>
        </div>

        {/* Index Size */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Est. index size</span>
          <span className="text-zinc-700">{formatSize(data.totalMemories)}</span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last indexed</span>
          <div className="flex items-center gap-1 text-zinc-700">
            <Clock className="w-3 h-3" />
            <span>{formatDate(data.lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Data Source Badge */}
      {data.source === 'mock' && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">
            Using mock data
          </span>
        </div>
      )}
    </div>
  );
}
