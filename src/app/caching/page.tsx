"use client";

import { useState, useEffect } from "react";
import { Database, AlertTriangle } from "lucide-react";
import { CacheEfficiencyCard } from "@/components/caching/cache-efficiency-card";
import { CacheChart } from "@/components/caching/cache-chart";
import { CacheTrend } from "@/components/caching/cache-trend";
import { CacheBreakdown } from "@/components/caching/cache-breakdown";

type CostData = {
  today: {
    cacheRead: number;
    cacheWrite: number;
    input: number;
    output: number;
  };
  byDay: Array<{
    date: string;
    cacheRead: number;
    cacheWrite: number;
    input: number;
    output: number;
  }>;
  byType: {
    cacheRead: { tokens: number; cost: number };
    cacheWrite: { tokens: number; cost: number };
    input: { tokens: number; cost: number };
    output: { tokens: number; cost: number };
  };
};

export default function CachingPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/costs");
      if (!response.ok) throw new Error("Failed to fetch cost data");
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!data || !data.byDay || data.byDay.length === 0) {
      return {
        hitRate: 0,
        cacheReadCost: 0,
        cacheReadTokens: 0,
        totalTokens: 0,
      };
    }

    const last7Days = data.byDay.slice(0, 7);
    const totalTokens = last7Days.reduce(
      (sum, d) => sum + d.cacheRead + d.cacheWrite + d.input + d.output,
      0
    );
    const cacheReadTokens = last7Days.reduce((sum, d) => sum + d.cacheRead, 0);
    const cacheReadCost = last7Days.reduce((sum, d) => sum + (d.cacheRead * 0.00015), 0);

    return {
      hitRate: totalTokens > 0 ? (cacheReadTokens / totalTokens) * 100 : 0,
      cacheReadCost,
      cacheReadTokens,
      totalTokens,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Prompt Caching</h1>
          <p className="text-muted-foreground text-sm">Cache efficiency and cost savings visualization</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 dark:bg-secondary rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Prompt Caching</h1>
          <p className="text-muted-foreground text-sm">Cache efficiency and cost savings visualization</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            Unable to load cache data: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.byDay || data.byDay.length === 0) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Prompt Caching</h1>
          <p className="text-muted-foreground text-sm">Cache efficiency and cost savings visualization</p>
        </div>
        <div className="bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-border rounded-xl p-12 text-center">
          <Database size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-foreground mb-2">No Cache Data Available</h3>
          <p className="text-muted-foreground">Cache metrics will appear after first Q session completes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Prompt Caching</h1>
        <p className="text-muted-foreground text-sm">Cache efficiency and cost savings visualization</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <CacheEfficiencyCard
          hitRate={stats.hitRate}
          cacheReadCost={stats.cacheReadCost}
          cacheReadTokens={stats.cacheReadTokens}
          totalTokens={stats.totalTokens}
          period="7d"
        />

        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Cache Savings (7 days)</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-foreground mt-2">
            ${stats.cacheReadCost.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">90% cheaper than fresh tokens</p>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Tokens Served (7 days)</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-foreground mt-2">
            {(stats.cacheReadTokens / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            of {(stats.totalTokens / 1000000).toFixed(1)}M total
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4 mb-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground mb-4">
          Token Distribution (Last 14 Days)
        </h3>
        <CacheChart data={data.byDay.slice(0, 14)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground mb-4">
            Cache Hit Rate Trend (7 Days)
          </h3>
          <CacheTrend data={data.byDay.slice(0, 7)} />
        </div>

        <CacheBreakdown
          tokens={{
            cacheRead: data.byType?.cacheRead?.tokens || 0,
            cacheWrite: data.byType?.cacheWrite?.tokens || 0,
            input: data.byType?.input?.tokens || 0,
            output: data.byType?.output?.tokens || 0,
            total: (data.byType?.cacheRead?.tokens || 0) +
                   (data.byType?.cacheWrite?.tokens || 0) +
                   (data.byType?.input?.tokens || 0) +
                   (data.byType?.output?.tokens || 0),
          }}
          costs={{
            cacheRead: data.byType?.cacheRead?.cost || 0,
            cacheWrite: data.byType?.cacheWrite?.cost || 0,
            input: data.byType?.input?.cost || 0,
            output: data.byType?.output?.cost || 0,
            total: (data.byType?.cacheRead?.cost || 0) +
                   (data.byType?.cacheWrite?.cost || 0) +
                   (data.byType?.input?.cost || 0) +
                   (data.byType?.output?.cost || 0),
          }}
        />
      </div>
    </div>
  );
}
