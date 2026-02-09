"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommitInfo } from "@/lib/backup-checker";
import { GitCommit, Calendar } from "lucide-react";

interface BackupHistoryProps {
  commits: CommitInfo[];
}

export function BackupHistory({ commits }: BackupHistoryProps) {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  if (!commits || commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Recent History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">No recent commits found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Recent History</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Last 7 days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {commits.map((commit, index) => (
            <div
              key={commit.hash}
              className={`flex items-start gap-3 pb-3 ${
                index !== commits.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              <div className="mt-1">
                <GitCommit className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {commit.message}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {commit.shortHash}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{commit.author}</span>
                  <span>•</span>
                  <span>{formatDate(commit.timestamp)}</span>
                  <span className="text-zinc-400">
                    ({formatTimeAgo(commit.timestamp)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-zinc-200">
          <p className="text-xs text-zinc-500 text-center">
            {commits.length} commit{commits.length !== 1 ? 's' : ''} in the last 7 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
