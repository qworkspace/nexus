"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Pause,
  Play,
  Search,
  Filter,
  X,
} from "lucide-react";
import useSWR from "swr";
import { LogEntry, type LogEntry as LogEntryType } from "./LogEntry";

interface LogsResponse {
  source: "live" | "mock" | "error";
  logs: LogEntryType[];
  count: number;
  error?: string;
}

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
    new Set(["info", "warn", "error", "debug"])
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
  const availableSources = data?.logs
    ? Array.from(new Set(data.logs.map((log) => log.source))).sort()
    : [];

  // Filter logs based on criteria
  const filteredLogs = data?.logs?.filter((log) => {
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
  }) || [];

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
    setLevelFilter(new Set(["info", "warn", "error", "debug"]));
    setSourceFilter(new Set());
    setSearchQuery("");
  };

  const LEVEL_COLORS = {
    info: "bg-blue-500",
    warn: "bg-yellow-500",
    error: "bg-red-500",
    debug: "bg-zinc-500",
  };

  const activeFiltersCount =
    (levelFilter.size < 4 ? 4 - levelFilter.size : 0) + sourceFilter.size;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>System Logs</CardTitle>
            {data?.source === "mock" && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                Mock Data
              </span>
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
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {/* Level Filters */}
            <div>
              <div className="text-sm font-medium mb-2">Log Level</div>
              <div className="flex gap-2">
                {(["info", "warn", "error", "debug"] as const).map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter.has(level) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLevelFilter(level)}
                    className="capitalize"
                  >
                    <span
                      className={`h-2 w-2 rounded-full mr-2 ${LEVEL_COLORS[level]}`}
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
                  {availableSources.slice(0, 10).map((source) => (
                    <Button
                      key={source}
                      variant={sourceFilter.has(source) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSourceFilter(source)}
                      className="capitalize text-xs"
                    >
                      {source}
                    </Button>
                  ))}
                  {availableSources.length > 10 && (
                    <span className="text-xs text-zinc-500">
                      +{availableSources.length - 10} more
                    </span>
                  )}
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
          <div ref={scrollRef} className="space-y-1 pb-4">
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
              filteredLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
