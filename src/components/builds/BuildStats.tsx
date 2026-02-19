'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BuildStats } from '@/types/builds';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';

export function BuildStats() {
  const [stats, setStats] = useState<BuildStats>({
    totalToday: 0,
    successRate: 0,
    avgDuration: 0,
    totalCost: 0,
    totalLinesChanged: 0,
    period: '24h',
  });

  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/builds/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch build stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatCost = (cost: number) => {
    return cost.toFixed(2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-16 animate-pulse" />
                <div className="h-8 bg-zinc-200 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Stats
          <span className="ml-2 text-xs text-muted-foreground font-normal">Today</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-1">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs rounded ${
                  period === p
                    ? 'bg-card text-foreground dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 text-muted-foreground dark:bg-secondary dark:text-muted-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Builds */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span>Builds</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-foreground">
              {stats.totalToday}
            </div>
          </div>

          {/* Success Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Success</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-foreground">
              {stats.successRate.toFixed(0)}%
            </div>
          </div>

          {/* Avg Duration */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Avg Time</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-foreground">
              {formatDuration(stats.avgDuration)}
            </div>
          </div>

          {/* Total Cost */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Cost</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-foreground">
              ${formatCost(stats.totalCost)}
            </div>
          </div>

          {/* Lines Changed */}
          <div className="space-y-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span>Lines</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-foreground">
              {stats.totalLinesChanged.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
