'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BuildSpeedMetrics } from '@/types/builds';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity, RefreshCw } from 'lucide-react';

export function BuildSpeedMetrics() {
  const [metrics, setMetrics] = useState<BuildSpeedMetrics>({
    specToShipTime: [],
    buildDurationTrend: [],
    buildsPerDay: [],
    reworkRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/builds/speed');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Build Speed Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (label: string | number | undefined): string => {
    if (typeof label !== 'string' && typeof label !== 'number') return '';
    if (typeof label !== 'string') return String(label);
    const date = new Date(label);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipLabel = (label: unknown): string => {
    if (typeof label !== 'string' && typeof label !== 'number') return '';
    if (typeof label !== 'string') return String(label);
    const date = new Date(label);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Build Speed Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Avg Spec-to-Ship */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Activity className="h-3 w-3" />
              <span>Avg Spec-to-Ship</span>
            </div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {metrics.specToShipTime.length > 0
                ? `${Math.round(metrics.specToShipTime.reduce((a, b) => a + b.minutes, 0) / metrics.specToShipTime.length / 60)}h`
                : '—'}
            </div>
          </div>

          {/* Builds Per Day */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>Avg Builds/Day (7d)</span>
            </div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {metrics.buildsPerDay.length > 0
                ? `${Math.round(metrics.buildsPerDay.slice(-7).reduce((a, b) => a + b.count, 0) / 7)}`
                : '—'}
            </div>
          </div>

          {/* Rework Rate */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <RefreshCw className="h-3 w-3" />
              <span>Rework Rate</span>
            </div>
            <div className={`text-lg font-semibold ${metrics.reworkRate > 20 ? 'text-[#FFE135]' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {metrics.reworkRate}%
            </div>
          </div>
        </div>

        {/* Builds Per Day Chart */}
        <div className="h-48">
          <h4 className="text-xs font-medium text-zinc-500 mb-2">Builds Per Day (Last 14 days)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.buildsPerDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" fill="currentColor" className="text-zinc-600">
                {metrics.buildsPerDay.map((entry, index) => (
                  <Cell key={index} fill={index === metrics.buildsPerDay.length - 1 ? '#3b82f6' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
