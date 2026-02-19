"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useState } from "react";
import { Brain, Search } from "lucide-react";

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
  if (percentage < 50) return "bg-zinc-500";
  if (percentage < 75) return "bg-zinc-500";
  return "bg-zinc-500";
}

export function MemoryContextPanel() {
  const { data, isLoading } = useSWR<MemoryStats>(
    "/api/memory/stats",
    fetcher,
    { refreshInterval: 10000 }
  );
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Card className="">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Brain size={16} />
          Memory & Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-zinc-50">
            <p className="text-[10px] text-muted-foreground uppercase">Files</p>
            <p className="text-lg font-bold text-zinc-900">
              {data?.totalFiles || 0}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50">
            <p className="text-[10px] text-muted-foreground uppercase">Total Size</p>
            <p className="text-lg font-bold text-zinc-900">
              {formatSize(data?.totalSize || 0)}
            </p>
          </div>
        </div>

        {/* Context Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Context</span>
            <span className="font-mono text-muted-foreground">
              {isLoading ? "..." : `${data?.currentContext?.percentage}%`}
            </span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            {isLoading ? (
              <div className="h-full w-1/4 shimmer" />
            ) : (
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getContextColor(data?.currentContext?.percentage || 0)
                )}
                style={{ width: `${data?.currentContext?.percentage || 0}%` }}
              />
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Input
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-8"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground px-1 py-0.5 bg-zinc-100 rounded">
            /
          </kbd>
        </div>

        {/* Topic Cloud - Compact */}
        {data?.topicCloud && data?.topicCloud?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(data?.topicCloud || []).slice(0, 5).map(({ topic }) => (
              <button
                key={topic}
                onClick={() => setSearchQuery(topic)}
                className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 hover:bg-zinc-200 text-muted-foreground transition-colors"
              >
                #{topic}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
