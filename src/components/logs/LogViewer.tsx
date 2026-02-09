"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Pause,
  Play,
  Download,
  Search,
  Filter,
  X,
} from "lucide-react";
import useSWR from "swr";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  sessionId?: string;
  cronId?: string;
  channelId?: string;
}

interface LogsResponse {
  source: "live" | "mock" | "error";
  logs: LogEntry[];
  count: number;
  error?: string;
}

const LEVEL_COLORS = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warn: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

const LEVEL_DOT = {
  info: "bg-blue-500",
  warn: "bg-yellow-500",
  error: "bg-red-500",
};

const SOURCE_COLORS: Record<string, string> = {
  agent: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cron: "bg-green-500/10 text-green-500 border-green-500/20",
  channel: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  gateway: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  system: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

async function fetcher(url: string): Promise<LogsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function LogViewer() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<Set<string>>(
    new Set(["info", "warn", "error"])
  );
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch logs with SWR
  const { data, error, isLoading, mutate } = useSWR<LogsResponse>(
    "/api/logs?limit=500",
    fetcher,
    {
      refreshInterval: autoScroll ? 2000 : 0, // Refresh every 2s when auto-scroll is on
      revalidateOnFocus: false,
    }
  );

  // Update lastUpdated timestamp
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data, autoScroll]);

  // Get unique sources from logs
  const availableSources = useMemo(() => {
    if (!data?.logs) return [];
    const sources = new Set(data.logs.map((log) => log.source));
    return Array.from(sources).sort();
  }, [data]);

  // Filter logs based on criteria
  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];

    return data.logs.filter((log) => {
      // Level filter
      if (!levelFilter.has(log.level)) return false;

      // Source filter (if any sources selected)
      if (sourceFilter.size > 0 && !sourceFilter.has(log.source)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query) ||
          log.level.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [data, levelFilter, sourceFilter, searchQuery]);

  // Toggle level filter
  const toggleLevelFilter = (level: string) => {
    const newFilter = new Set(levelFilter);
    if (newFilter.has(level)) {
      newFilter.delete(level);
    } else {
      newFilter.add(level);
    }
    setLevelFilter(newFilter);
  };

  // Toggle source filter
  const toggleSourceFilter = (source: string) => {
    const newFilter = new Set(sourceFilter);
    if (newFilter.has(source)) {
      newFilter.delete(source);
    } else {
      newFilter.add(source);
    }
    setSourceFilter(newFilter);
  };

  // Clear all filters
  const clearFilters = () => {
    setLevelFilter(new Set(["info", "warn", "error"]));
    setSourceFilter(new Set());
    setSearchQuery("");
  };

  // Export logs to file
  const exportLogs = () => {
    const logsText = filteredLogs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        return `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`;
      })
      .join("\n");

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openclaw-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // If less than 1 minute, show seconds
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`;
    }
    // If less than 1 hour, show minutes
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    }
    // Otherwise show time
    return date.toLocaleTimeString();
  };

  const activeFiltersCount =
    (levelFilter.size < 3 ? 3 - levelFilter.size : 0) + sourceFilter.size;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>System Logs</CardTitle>
            {data?.source === "mock" && (
              <Badge variant="outline" className="text-xs">
                Mock Data
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {filteredLogs.length} logs • {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Auto-scroll Toggle */}
          <Button
            variant={autoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Auto
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Paused
              </>
            )}
          </Button>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {/* Level Filters */}
            <div>
              <div className="text-sm font-medium mb-2">Log Level</div>
              <div className="flex gap-2">
                {(["info", "warn", "error"] as const).map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter.has(level) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLevelFilter(level)}
                    className="capitalize"
                  >
                    <span
                      className={`h-2 w-2 rounded-full mr-2 ${LEVEL_DOT[level]}`}
                    />
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Source Filters */}
            {availableSources.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Source</div>
                <div className="flex gap-2 flex-wrap">
                  {availableSources.map((source) => (
                    <Button
                      key={source}
                      variant={sourceFilter.has(source) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSourceFilter(source)}
                      className="capitalize"
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[600px] px-6">
          <div ref={scrollRef} className="space-y-2 pb-4">
            {isLoading && filteredLogs.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                Loading logs...
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                Failed to load logs. Is the gateway running?
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                No logs found matching filters.
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="flex items-start gap-3 py-2 px-3 hover:bg-zinc-900/50 rounded-lg group transition-colors font-mono text-sm"
                >
                  {/* Timestamp */}
                  <span className="text-zinc-500 text-xs shrink-0 w-20">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* Level Badge */}
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${LEVEL_COLORS[log.level]}`}
                  >
                    {log.level.toUpperCase()}
                  </Badge>

                  {/* Source Badge */}
                  <Badge
                    variant="outline"
                    className={`shrink-0 capitalize ${
                      SOURCE_COLORS[log.source] || SOURCE_COLORS.system
                    }`}
                  >
                    {log.source}
                  </Badge>

                  {/* Message */}
                  <span className="text-zinc-300 flex-1 break-words">
                    {log.message}
                  </span>

                  {/* Metadata */}
                  {(log.sessionId || log.cronId || log.channelId) && (
                    <span className="text-zinc-600 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {log.sessionId && `session:${log.sessionId.slice(0, 8)}`}
                      {log.cronId && `cron:${log.cronId}`}
                      {log.channelId && `channel:${log.channelId}`}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
