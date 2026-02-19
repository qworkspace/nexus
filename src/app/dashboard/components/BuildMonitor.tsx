"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Activity, Clock, CheckCircle, BarChart3, List, FileCode, TrendingUp } from "lucide-react";
import useSWR from "swr";

// Types
interface ActiveBuild {
  id: string;
  label: string;
  task: string;
  startedAt: string;
  runtime: number;
  tokens: number;
  model: string;
  status: 'building' | 'processing' | 'error';
}

interface SpecItem {
  id: string;
  title: string;
  status: 'ready' | 'building' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  created: string;
}

interface RecentBuild {
  id: string;
  label: string;
  completedAt: string;
  lines: number;
  duration: number;
  status: 'success' | 'error' | 'cancelled';
  model?: string;
}

interface BuildStats {
  today: {
    lines_shipped: number;
    builds_completed: number;
    success_rate: number;
    avg_duration: number;
    total_tokens: number;
  };
  week: {
    lines_shipped: number;
    builds_completed: number;
    success_rate: number;
    avg_duration: number;
  };
  models: {
    [key: string]: {
      builds: number;
      tokens: number;
      lines: number;
    };
  };
}

interface ActiveBuildsResponse {
  source: 'live' | 'mock' | 'error';
  builds: ActiveBuild[];
  error?: string;
}

interface QueueResponse {
  source: 'live' | 'error';
  specs: SpecItem[];
  error?: string;
}

interface RecentBuildsResponse {
  source: 'live' | 'mock' | 'error';
  builds: RecentBuild[];
  error?: string;
}

interface StatsResponse {
  source: 'live' | 'mock' | 'error';
  stats: BuildStats;
  error?: string;
}

async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function BuildMonitor() {
  const { data: activeData, mutate: mutateActive } = useSWR<ActiveBuildsResponse>(
    '/api/builds/active',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const { data: queueData, mutate: mutateQueue } = useSWR<QueueResponse>(
    '/api/builds/queue',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const { data: recentData, mutate: mutateRecent } = useSWR<RecentBuildsResponse>(
    '/api/builds/recent',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const { data: statsData, mutate: mutateStats } = useSWR<StatsResponse>(
    '/api/builds/stats',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const activeBuilds = activeData?.builds || [];
  const queueSpecs = queueData?.specs || [];
  const recentBuilds = recentData?.builds || [];
  const stats = statsData?.stats;

  // Helper functions
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  const formatLines = (lines: number): string => {
    if (lines >= 1000) return `${(lines / 1000).toFixed(1)}k`;
    return lines.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'building':
      case 'processing':
        return <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">BUILDING</Badge>;
      case 'ready':
        return <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">READY</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">SUCCESS</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">ERROR</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">CANCELLED</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-xs text-zinc-600">DONE</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">BLOCKED</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status.toUpperCase()}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">HIGH</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-200">MED</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs text-zinc-600">LOW</Badge>;
      default:
        return null;
    }
  };

  const getModelLabel = (model: string): string => {
    const labels: Record<string, string> = {
      'claude-opus-4-5': 'Opus',
      'claude-sonnet-4': 'Sonnet',
      'claude-3-5-sonnet': 'Sonnet 3.5',
      'glm-4.7': 'GLM-4.7',
      'glm-4-flash': 'GLM-4',
    };
    return labels[model] || model.split('/').pop() || model;
  };

  const getTimeAgo = (timestamp: string): string => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefresh = () => {
    mutateActive();
    mutateQueue();
    mutateRecent();
    mutateStats();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-500" />
            BUILD MONITOR
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            {activeBuilds.length} active · {queueSpecs.filter(s => s.status === 'ready').length} queued · {stats?.today.builds_completed || 0} completed today
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Active
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex-1">
              <List className="h-3.5 w-3.5 mr-1.5" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Active Builds Tab */}
          <TabsContent value="active" className="space-y-3">
            {activeBuilds.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No active builds</p>
                <p className="text-xs text-zinc-400 mt-1">All specs are waiting or completed</p>
              </div>
            ) : (
              activeBuilds.map((build) => (
                <div
                  key={build.id}
                  className="border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {build.label}
                        </p>
                        {getStatusBadge(build.status)}
                      </div>
                      <p className="text-xs text-zinc-600 line-clamp-2">
                        {build.task}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(build.runtime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode className="h-3 w-3" />
                      {formatTokens(build.tokens)} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {getModelLabel(build.model)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-2">
            {queueSpecs.length === 0 ? (
              <div className="text-center py-8">
                <List className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Queue is empty</p>
                <p className="text-xs text-zinc-400 mt-1">No specs waiting to be built</p>
              </div>
            ) : (
              queueSpecs.map((spec) => (
                <div
                  key={spec.id}
                  className="border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500">#{spec.id}</span>
                        <p className="text-sm font-medium text-zinc-900">
                          {spec.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(spec.status)}
                        {getPriorityBadge(spec.priority)}
                        <Badge variant="outline" className="text-xs text-zinc-600">
                          {spec.effort}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Created: {spec.created}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-2">
            {recentBuilds.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No recent builds</p>
                <p className="text-xs text-zinc-400 mt-1">Completed builds will appear here</p>
              </div>
            ) : (
              recentBuilds.map((build) => (
                <div
                  key={build.id}
                  className="border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {build.label}
                        </p>
                        {getStatusBadge(build.status)}
                      </div>
                      {build.model && (
                        <p className="text-xs text-zinc-500">
                          {getModelLabel(build.model)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {formatLines(build.lines)} lines
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(build.duration)}
                      </span>
                    </div>
                    <span>{getTimeAgo(build.completedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {!stats ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No stats available</p>
              </div>
            ) : (
              <>
                {/* Today's Stats */}
                <div className="border border-zinc-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                    Today
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Lines Shipped</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {formatLines(stats.today.lines_shipped)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Builds</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {stats.today.builds_completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Success Rate</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {(stats.today.success_rate * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Avg Duration</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {formatDuration(stats.today.avg_duration)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Week Stats */}
                <div className="border border-zinc-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                    This Week
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Lines Shipped</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {formatLines(stats.week.lines_shipped)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Builds</p>
                      <p className="text-2xl font-semibold text-zinc-900">
                        {stats.week.builds_completed}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Model Usage */}
                {Object.keys(stats.models).length > 0 && (
                  <div className="border border-zinc-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                      Model Usage
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(stats.models).map(([model, data]) => (
                        <div key={model} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-900 font-medium">
                              {getModelLabel(model)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {data.builds} builds
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span>{formatTokens(data.tokens)} tokens</span>
                            <span>{formatLines(data.lines)} lines</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
