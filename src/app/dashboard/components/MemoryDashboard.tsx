"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Search, Calendar, FileText, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { MemorySearch } from "./MemorySearch";
import { MemoryTimeline } from "./MemoryTimeline";

interface MemoryOverview {
  memoryMd: string;
  dailyFiles: Array<{
    name: string;
    path: string;
    size: number;
    modified: string;
  }>;
  stats: {
    totalFiles: number;
    totalSize: number;
    lastModified: string;
  };
}

async function fetcher(url: string): Promise<MemoryOverview> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function MemoryDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "search" | "timeline">("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, mutate } = useSWR<MemoryOverview>(
    '/api/memory/overview',
    fetcher,
    {
      refreshInterval: 60000, // 60-second refresh
      revalidateOnFocus: false,
    }
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveTab("search");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="col-span-12">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Q MEMORY DASHBOARD
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => mutate()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("overview")}
          >
            <FileText className="h-4 w-4 mr-1" />
            Overview
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("search")}
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <Button
            variant={activeTab === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("timeline")}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Timeline
          </Button>
        </div>

        {/* Quick Search Bar */}
        {activeTab !== "search" && (
          <div className="mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search memory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-center py-8 text-red-500">
            Failed to load memory data
          </div>
        )}

        {activeTab === "overview" && data && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Total Memories
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {data.stats.totalFiles}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Total Size
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatBytes(data.stats.totalSize)}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(data.stats.lastModified)}
                </p>
              </div>
            </div>

            {/* MEMORY.md Preview */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Long-Term Memory (MEMORY.md)
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                  {data.memoryMd.slice(0, 2000)}
                  {data.memoryMd.length > 2000 && "\n\n... (truncated)"}
                </pre>
              </div>
            </div>

            {/* Recent Daily Files */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Recent Daily Memories
              </h3>
              <div className="space-y-2">
                {data.dailyFiles.slice(0, 10).map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(file.modified)}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <MemorySearch initialQuery={searchQuery} />
        )}

        {activeTab === "timeline" && (
          <MemoryTimeline />
        )}
      </CardContent>
    </Card>
  );
}
