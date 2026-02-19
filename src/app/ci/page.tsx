'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CIDashboardData, CIQueueItem, CIBuild } from '@/types/ci';
import { RefreshCw, Clock, Cpu, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function CIPage() {
  const [data, setData] = useState<CIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchCI = async () => {
    try {
      const res = await fetch('/api/ci', { cache: 'no-store' });
      if (res.ok) {
        const ciData = await res.json();
        setData(ciData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch CI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCI();
    const interval = setInterval(fetchCI, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">🔄 CI Pipeline Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Live CI pipeline visibility</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span>Auto-refreshes every 30s</span>
            </div>
            <button
              onClick={fetchCI}
              className="px-3 py-1.5 text-sm bg-card text-foreground rounded-md hover:bg-secondary transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading CI data...</span>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Build Queue */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">
              Build Queue ({data.queue.length} pending)
            </h2>
            <Card>
              <CardContent className="p-4">
                {data.queue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No specs queued for build</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.queue.map((item) => (
                      <QueueItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Build */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">Active Build</h2>
            <ActiveBuildSection build={data.activeBuild} />
          </div>

          {/* Two column layout for recent builds and health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Builds */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">
                Recent Builds (Last {data.recentBuilds.length})
              </h2>
              <Card>
                <CardContent className="p-4">
                  {data.recentBuilds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No recent builds</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.recentBuilds.map((build) => (
                        <BuildRow key={build.id} build={build} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Health */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">Pipeline Health</h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Success Rate */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                      </div>
                      <span className="text-xl font-bold text-zinc-900">
                        {data.health.successRate}%
                      </span>
                    </div>

                    {/* Total Builds */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Builds (last 50)</span>
                      <span className="font-medium">{data.health.totalBuilds}</span>
                    </div>

                    {/* Success/Fail Counts */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900">✓</span>
                        <span className="text-muted-foreground">{data.health.successCount} success</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">✗</span>
                        <span className="text-muted-foreground">{data.health.failureCount} failed</span>
                      </div>
                    </div>

                    {/* Failures by Project */}
                    {Object.keys(data.health.failuresByProject).length > 0 && (
                      <div className="pt-3 border-t border-zinc-200">
                        <p className="text-xs text-muted-foreground mb-2">Failures by Project</p>
                        <div className="space-y-1">
                          {Object.entries(data.health.failuresByProject).map(([project, count]) => (
                            <div key={project} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{project}</span>
                              <span className="font-medium text-zinc-500">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Last updated */}
          <div className="text-center text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Failed to load CI data</p>
        </div>
      )}
    </div>
  );
}

function QueueItem({ item }: { item: CIQueueItem }) {
  const priorityColors = {
    HIGH: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    MED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    LOW: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  const riskColors = {
    LOW: 'text-zinc-900',
    MEDIUM: 'text-zinc-500',
    HIGH: 'text-zinc-500',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
      <span className={cn('px-2 py-1 text-xs font-medium rounded border', priorityColors[item.priority])}>
        {item.priority}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          Risk: <span className={cn('font-medium', riskColors[item.riskLevel])}>{item.riskLevel}</span>
        </p>
      </div>
    </div>
  );
}

function ActiveBuildSection({ build }: { build: CIBuild | null }) {
  if (!build) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active builds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded">
                RUNNING
              </span>
              <span className="text-xs text-muted-foreground">
                {build.agent || 'dev'}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-900 truncate">
              {build.spec}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Started {new Date(build.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BuildRow({ build }: { build: CIBuild }) {
  const isSuccess = build.status === 'success';
  const isFailed = build.status === 'failed';

  return (
    <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <span className="text-zinc-500">✓</span>
        ) : isFailed ? (
          <span className="text-zinc-500">✗</span>
        ) : (
          <AlertTriangle className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {build.spec}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {build.project && <span>{build.project}</span>}
          {build.testStatus && (
            <>
              <span>•</span>
              <span className={build.testStatus === 'pass' ? 'text-zinc-900' : 'text-zinc-500'}>
                TEST: {build.testStatus.toUpperCase()}
              </span>
            </>
          )}
          {build.testDetails && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]">{build.testDetails}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
