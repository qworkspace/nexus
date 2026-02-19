"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, X } from "lucide-react";
import useSWR from "swr";

interface RunEntry {
  id: string;
  cronJobId: string;
  startedAtMs: number;
  status: 'ok' | 'error' | 'timeout';
  durationMs?: number;
  error?: string;
}

interface CronRunsResponse {
  source: 'live' | 'mock' | 'error';
  entries: RunEntry[];
  error?: string;
}

async function fetcher(url: string): Promise<CronRunsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

interface CronHistoryProps {
  jobId: string;
  jobName?: string;
  onClose?: () => void;
}

export function CronHistory({ jobId, jobName, onClose }: CronHistoryProps) {
  const [limit, setLimit] = useState(20);
  const { data, isLoading, mutate, error } = useSWR<CronRunsResponse>(
    `/api/crons/runs?id=${jobId}&limit=${limit}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  const entries = data?.entries || [];

  const getTimeAgo = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Australia/Sydney',
    });
  };

  const getStatusIcon = (status: RunEntry['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-zinc-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-zinc-500" />;
      case 'timeout':
        return <AlertTriangle className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: RunEntry['status']) => {
    switch (status) {
      case 'ok':
        return <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">SUCCESS</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">ERROR</Badge>;
      case 'timeout':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">TIMEOUT</Badge>;
    }
  };

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  const successCount = entries.filter(e => e.status === 'ok').length;
  const errorCount = entries.filter(e => e.status === 'error').length;
  const avgDuration = entries
    .filter(e => e.durationMs !== undefined)
    .reduce((sum, e) => sum + (e.durationMs || 0), 0) / Math.max(entries.filter(e => e.durationMs !== undefined).length, 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            Run History
            {jobName && <span className="text-zinc-500 font-normal ml-2">{jobName}</span>}
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            {entries.length} entries · {successCount} success · {errorCount} errors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div>
            <span className="text-zinc-500">Avg Duration:</span>{' '}
            <span className="text-zinc-900 font-mono">
              {(avgDuration / 1000).toFixed(1)}s
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Success Rate:</span>{' '}
            <span className="text-zinc-900 font-mono">
              {entries.length > 0 ? ((successCount / entries.length) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-zinc-500">
              Loading history...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">
              No run history available
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(entry.status)}
                    <div>
                      <div className="text-xs font-medium text-zinc-900">
                        {getTimeAgo(entry.startedAtMs)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatTime(entry.startedAtMs)}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(entry.status)}
                </div>

                {entry.durationMs !== undefined && (
                  <div className="text-xs text-zinc-600">
                    Duration:{' '}
                    <span className="font-mono">{(entry.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                )}

                {entry.error && (
                  <div className="mt-2 text-xs text-zinc-500 bg-zinc-50 rounded p-2">
                    {entry.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {entries.length >= limit && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              Load More
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-xs text-zinc-500 text-center">
            Failed to load history: {error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
