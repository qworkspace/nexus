'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Clock, Cpu, TrendingUp, AlertTriangle, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpecQueueItem } from '@/app/api/ci/specs/route';
import type { BuildEntry, BuildSummary } from '@/app/api/ci/builds/route';
import type { ActiveSession } from '@/app/api/ci/active/route';

export const dynamic = 'force-dynamic';

export default function CIPipelinePage() {
  const [specs, setSpecs] = useState<SpecQueueItem[]>([]);
  const [activeBuilds, setActiveBuilds] = useState<ActiveSession[]>([]);
  const [recentBuilds, setRecentBuilds] = useState<BuildEntry[]>([]);
  const [buildSummary, setBuildSummary] = useState<BuildSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAllData = async () => {
    try {
      const [specsRes, buildsRes, activeRes] = await Promise.all([
        fetch('/api/ci/specs', { cache: 'no-store' }),
        fetch('/api/ci/builds', { cache: 'no-store' }),
        fetch('/api/ci/active', { cache: 'no-store' }),
      ]);

      if (specsRes.ok) {
        const specsData = await specsRes.json();
        setSpecs(specsData);
      }

      if (buildsRes.ok) {
        const buildsData = await buildsRes.json();
        setRecentBuilds(buildsData.builds || []);
        setBuildSummary(buildsData.summary || null);
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveBuilds(activeData.sessions || []);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch CI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">CI Pipeline</h1>
            <p className="text-zinc-500 text-sm mt-1">Live CI pipeline state and build queue</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span>Auto-refreshes every 30s</span>
            </div>
            <button
              onClick={fetchAllData}
              className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && specs.length === 0 && recentBuilds.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-zinc-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading CI data...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top row: Spec Queue and Active Builds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spec Queue Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Spec Queue ({specs.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {specs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No specs queued for build</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {specs.map((spec) => (
                      <SpecItem key={spec.id} spec={spec} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Builds Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Active Builds ({activeBuilds.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {activeBuilds.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No active builds</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {activeBuilds.map((build) => (
                      <ActiveBuildItem key={build.id} build={build} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trend Summary Card */}
          {buildSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Build Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {buildSummary.successRate}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {buildSummary.totalBuilds}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Total Builds</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {buildSummary.successCount}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Successful</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">
                      {buildSummary.failedCount}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Builds Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Builds (Last {recentBuilds.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentBuilds.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">No recent builds</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBuilds.map((build) => (
                    <BuildRow key={build.id} build={build} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last updated */}
          <div className="text-center text-xs text-zinc-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLORS = {
  HIGH: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900',
  LOW: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
} as const;

function SpecItem({ spec }: { spec: SpecQueueItem }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <span className={cn('px-2 py-1 text-xs font-medium rounded border', PRIORITY_COLORS[spec.priority])}>
        {spec.priority}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {spec.title}
        </p>
        <p className="text-xs text-zinc-500">
          Created: {spec.createdAt}
        </p>
      </div>
    </div>
  );
}

function ActiveBuildItem({ build }: { build: ActiveSession }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
            RUNNING
          </span>
          <span className="text-xs text-zinc-500">{build.model}</span>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {build.key}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <Clock className="h-3 w-3" />
          <span>Started {new Date(build.startedAt).toLocaleTimeString()}</span>
          <span>•</span>
          <span>{Math.floor(build.ageMs / 60000)}m ago</span>
        </div>
      </div>
    </div>
  );
}

function BuildRow({ build }: { build: BuildEntry }) {
  const isSuccess = build.status === 'SUCCESS';
  const isFailed = build.status === 'FAILED';

  const statusColors = {
    SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    SKIPPED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
    STALLED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    OTHER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <span className="text-green-500">✓</span>
        ) : isFailed ? (
          <span className="text-red-500">✗</span>
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColors[build.status])}>
            {build.status}
          </span>
          <span className="text-xs text-zinc-500">{build.timestamp}</span>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {build.spec}
        </p>
        {build.testStatus && (
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>TEST: {build.testStatus}</span>
            {build.testDetails && (
              <>
                <span>•</span>
                <span className="truncate max-w-[300px]">{build.testDetails}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
