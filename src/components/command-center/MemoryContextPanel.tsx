"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useState } from "react";

interface MemoryEntry {
  date: string;
  title: string;
  preview: string;
  size: number;
}

interface MemoryStats {
  source: string;
  currentContext: {
    used: number;
    max: number;
    percentage: number;
  };
  recentEntries: MemoryEntry[];
  topicCloud: { topic: string; count: number }[];
  totalFiles: number;
  totalSize: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function getContextColor(percentage: number): string {
  if (percentage < 50) return "bg-green-500";
  if (percentage < 75) return "bg-yellow-500";
  return "bg-red-500";
}

export function MemoryContextPanel() {
  const { data, isLoading } = useSWR<MemoryStats>(
    "/api/memory/stats",
    fetcher,
    { refreshInterval: 10000 }
  );
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">🧠</span>
          Memory & Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Context Usage</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">
              {isLoading ? "..." : `${data?.currentContext.percentage}%`}
            </span>
          </div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            {isLoading ? (
              <div className="h-full w-1/4 shimmer" />
            ) : (
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getContextColor(data?.currentContext.percentage || 0)
                )}
                style={{ width: `${data?.currentContext.percentage || 0}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>
              {isLoading ? "..." : `${(data?.currentContext.used || 0).toLocaleString()} tokens`}
            </span>
            <span>
              {isLoading ? "..." : `${(data?.currentContext.max || 0).toLocaleString()} max`}
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Input
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm dark:bg-zinc-900/50 dark:border-zinc-700"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
            ⌕
          </span>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
            /
          </kbd>
        </div>

        {/* Topic Cloud */}
        {data?.topicCloud && data.topicCloud.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Topics
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.topicCloud.map(({ topic, count }) => (
                <button
                  key={topic}
                  onClick={() => setSearchQuery(topic)}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs transition-colors",
                    "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                    "text-zinc-600 dark:text-zinc-400"
                  )}
                  style={{
                    opacity: 0.6 + (count / (data.topicCloud[0]?.count || 1)) * 0.4,
                  }}
                >
                  #{topic}
                  <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Memory Entries */}
        <div className="space-y-2 pt-2 border-t dark:border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Recent Entries
          </h4>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.recentEntries.map(entry => (
                <div
                  key={entry.date}
                  className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {entry.title}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {entry.date}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {entry.preview}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="flex justify-between text-xs text-zinc-400 pt-2 border-t dark:border-zinc-800">
          <span>{data?.totalFiles || 0} memory files</span>
          <span>{formatSize(data?.totalSize || 0)} total</span>
        </div>
      </CardContent>
    </Card>
  );
}
