"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityCard } from "@/components/activity-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  title: string;
  description: string | null;
  metadata: string | null;
  duration: number | null;
  status: string;
}

const activityTypes = [
  { value: "", label: "All Types" },
  { value: "task", label: "Tasks" },
  { value: "message", label: "Messages" },
  { value: "cron", label: "Cron Jobs" },
  { value: "file", label: "Files" },
  { value: "search", label: "Searches" },
  { value: "spawn", label: "Spawned Agents" },
];

const statusFilters = [
  { value: "", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "error", label: "Errors" },
  { value: "pending", label: "Pending" },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchActivities = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("offset", currentOffset.toString());
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    try {
      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();

      if (reset) {
        setActivities(data.activities);
        setOffset(data.activities.length);
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
  }, [offset, typeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Activity Feed</h1>
        <p className="text-zinc-500 text-sm">
          Complete history of Q&apos;s actions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-zinc-50 rounded-lg">
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

        {(typeFilter || statusFilter || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter("");
              setStatusFilter("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Activity List */}
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
            <Button
              variant="outline"
              onClick={() => fetchActivities(false)}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
