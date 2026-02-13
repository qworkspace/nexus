'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Clock, TrendingUp, FileText, Hammer } from 'lucide-react';
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
                    <FileText className="h-5 w-5" />
                    Next Up ({specs.length} spec{specs.length !== 1 ? 's' : ''} waiting)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {specs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No specs queued. All caught up!</p>
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
                    <Hammer className="h-5 w-5" />
                    What&apos;s Building Now
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {activeBuilds.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Hammer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nothing building right now.</p>
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
                  Recently Completed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentBuilds.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">No builds yet.</p>
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

function SpecItem({ spec }: { spec: SpecQueueItem }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
      <span className="text-xl">📋</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">
          {spec.title}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Created: {spec.createdAt}
        </p>
      </div>
      {spec.priority === 'HIGH' && (
        <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded whitespace-nowrap">
          Critical
        </span>
      )}
    </div>
  );
}

function ActiveBuildItem({ build }: { build: ActiveSession }) {
  const minutesAgo = Math.floor(build.ageMs / 60000);
  const progressPercent = Math.min(60, minutesAgo * 2);

  return (
    <div className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
      <span className="text-2xl">🛠️</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-white text-lg truncate">
            Building: {build.key.replace(/^(spec-|ci-|dev-)/, '').replace(/-/g, ' ')}
          </h4>
          <span className="text-xs bg-yellow-900/50 text-yellow-400 px-3 py-1 rounded-full whitespace-nowrap">
            Building...
          </span>
        </div>
        <p className="text-sm text-zinc-400 mb-3">
          Started {formatRelativeTime(build.startedAt)}
        </p>
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Progress</span>
            <span>Estimated {progressPercent}%</span>
          </div>
          <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg">
          View Details
        </button>
      </div>
    </div>
  );
}

function BuildRow({ build }: { build: BuildEntry }) {
  const isSuccess = build.status === 'SUCCESS';
  const isFailed = build.status === 'FAILED';

  const icon = isSuccess ? '✅' : isFailed ? '❌' : '⚠️';
  const statusText = isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'STALLED';
  const statusColor = isSuccess ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-white truncate">
            {build.spec.replace(/^(CI:\s*)?/, '').replace(/-/g, ' ')}
          </h4>
          <span className={`text-xs font-bold ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <p className="text-sm text-zinc-400 mb-3">
          Completed {formatRelativeTime(build.timestamp)}
        </p>
        {build.testStatus && (
          <p className="text-sm text-zinc-400 mb-3">
            {isSuccess ? '✓' : '✗'} {build.testDetails || build.testStatus}
          </p>
        )}
        <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg">
          View Details
        </button>
        {!isSuccess && (
          <button className="w-full mt-2 bg-red-900/50 hover:bg-red-900/70 text-white text-sm py-2 px-4 rounded-lg">
            Retry Build
          </button>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return isoString;
  }

  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}
