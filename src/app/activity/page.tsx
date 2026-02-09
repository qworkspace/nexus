"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityCard } from "@/components/activity-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, Search, List, GitBranch } from "lucide-react";
import { Activity } from "@/types/activity";

const activityTypes = [
  { value: "", label: "All Types" },
  { value: "task", label: "Tasks" },
  { value: "message", label: "Messages" },
  { value: "cron", label: "Cron Jobs" },
  { value: "file", label: "Files" },
  { value: "search", label: "Searches" },
  { value: "spawn", label: "Spawned Agents" },
  { value: "tool", label: "Tools" },
  { value: "model", label: "Model Changes" },
];

const statusFilters = [
  { value: "", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "error", label: "Errors" },
  { value: "pending", label: "Pending" },
];

type ViewMode = "list" | "timeline";

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [total, setTotal] = useState(0);

  const fetchActivities = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    const params = new URLSearchParams();
    params.set("limit", "50");
    params.set("offset", currentOffset.toString());
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();

      if (reset) {
        setActivities(data.activities);
        setOffset(data.activities.length);
        setTotal(data.total);
      } else {
        setActivities((prev) => [...prev, ...data.activities]);
        setOffset((prev) => prev + data.activities.length);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  }, [offset, typeFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchActivities(true);
    }, 300); // Debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  const handleExport = async (format: "csv" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/activity?${params}`);
      if (format === "csv") {
        const csv = await res.text();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const json = await res.text();
        const blob = new Blob([json], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export activities:", error);
    }
  };

  const clearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const hasActiveFilters = typeFilter || statusFilter || dateFrom || dateTo || searchQuery;

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Activity Feed</h1>
            <p className="text-zinc-500 text-sm">
              Complete history of Q&apos;s actions {total > 0 && `(${total} total)`}
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Timeline
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-zinc-50 rounded-lg">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
        >
          {activityTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
        >
          {statusFilters.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">From:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">To:</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
          />
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Activity List */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {loading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}

          {!loading && activities.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-lg mb-2">No activities found</p>
              <p className="text-sm">
                Q will log actions here as they happen.
              </p>
            </div>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => fetchActivities(false)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      ) : (
        <TimelineView activities={activities} loading={loading} />
      )}
    </div>
  );
}

function TimelineView({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg mb-2">No activities found</p>
        <p className="text-sm">Q will log actions here as they happen.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-6">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200" />

      {activities.map((activity) => (
        <div key={activity.id} className="relative">
          {/* Timeline dot */}
          <div
            className={`absolute left-[-20px] w-3 h-3 rounded-full border-2 ${
              activity.status === "error"
                ? "bg-red-500 border-red-500"
                : activity.status === "pending"
                ? "bg-yellow-500 border-yellow-500"
                : "bg-green-500 border-green-500"
            }`}
          />

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {activity.type}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-zinc-400">{activity.action}</span>
            </div>

            <h3 className="font-medium text-zinc-900 mb-1">{activity.title}</h3>

            {activity.description && (
              <p className="text-sm text-zinc-600 mb-2">{activity.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              {activity.model && (
                <span>
                  Model: {activity.model}
                </span>
              )}
              {activity.cost !== null && activity.cost > 0 && (
                <span>
                  Cost: ${activity.cost.toFixed(4)}
                </span>
              )}
              {activity.duration && (
                <span>
                  Duration: {(activity.duration / 1000).toFixed(1)}s
                </span>
              )}
              {activity.tokensIn && (
                <span>
                  Tokens: {activity.tokensIn.toLocaleString()} in /{" "}
                  {activity.tokensOut?.toLocaleString() || 0} out
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
