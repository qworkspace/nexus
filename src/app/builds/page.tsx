"use client";

import { ActiveBuilds } from "@/components/builds/ActiveBuilds";
import { RecentBuilds } from "@/components/builds/RecentBuilds";
import { BuildQueue } from "@/components/builds/BuildQueue";
import { BuildStats } from "@/components/builds/BuildStats";
import { FailedBuilds } from "@/components/builds/FailedBuilds";
import { useState, useEffect } from "react";
import { BuildSession, QueuedSpec, BuildStats as BuildStatsType } from "@/lib/build-mock";
import {
  transformActiveBuilds,
  transformQueue,
  transformStats,
  transformRecentBuilds,
} from "@/lib/build-data-transform";

export default function BuildsPage() {
  const [activeBuilds, setActiveBuilds] = useState<BuildSession[]>([]);
  const [recentBuilds, setRecentBuilds] = useState<BuildSession[]>([]);
  const [buildQueue, setBuildQueue] = useState<QueuedSpec[]>([]);
  const [buildStats, setBuildStats] = useState<BuildStatsType | null>(null);
  const [failedBuilds, setFailedBuilds] = useState<BuildSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBuildData = async () => {
    try {
      // Fetch all data in parallel
      const [activeRes, queueRes, statsRes, recentRes] = await Promise.all([
        fetch("/api/builds/active"),
        fetch("/api/builds/queue"),
        fetch("/api/builds/stats"),
        fetch("/api/builds/recent"),
      ]);

      const activeData = await activeRes.json();
      const queueData = await queueRes.json();
      const statsData = await statsRes.json();
      const recentData = await recentRes.json();

      // Transform API responses to component formats
      const transformedActive = transformActiveBuilds(activeData.builds || []);
      const transformedQueue = transformQueue(queueData.specs || []);
      const transformedStats = transformStats(
        statsData.stats,
        transformedActive.length,
        transformedQueue.length
      );
      const transformedRecent = transformRecentBuilds(recentData.builds || []);

      // Separate failed builds from recent builds
      const failed = transformedRecent.filter((b) => b.status === "error");
      const succeeded = transformedRecent.filter((b) => b.status === "complete");

      setActiveBuilds(transformedActive);
      setBuildQueue(transformedQueue);
      setBuildStats(transformedStats);
      setRecentBuilds(succeeded);
      setFailedBuilds(failed);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch build data:", error);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBuildData();
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBuildData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Build Monitor</h1>
          <p className="text-zinc-500 text-sm">
            Dev agent build tracking and management
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-zinc-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchBuildData}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
          >
            Refresh 🔄
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Active builds and stats */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              Loading build data...
            </div>
          ) : (
            <>
              <ActiveBuilds builds={activeBuilds} />
              <RecentBuilds builds={recentBuilds} />
            </>
          )}
        </div>

        {/* Right column - Stats and queue */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              Loading stats...
            </div>
          ) : buildStats ? (
            <>
              <BuildStats stats={buildStats} />
              <BuildQueue queue={buildQueue} />
            </>
          ) : (
            <div className="text-zinc-500">No stats available</div>
          )}
        </div>
      </div>

      {/* Failed builds - full width if any */}
      {!loading && failedBuilds.length > 0 && (
        <div className="mt-6">
          <FailedBuilds builds={failedBuilds} />
        </div>
      )}
    </div>
  );
}
