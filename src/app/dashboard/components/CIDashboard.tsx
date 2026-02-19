"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { RefreshCw, Cpu, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import type { CIDashboardData, CIBuild, CIQueueItem } from "@/types/ci";

async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function CIDashboard() {
  const { data, mutate, isLoading } = useSWR<CIDashboardData>(
    '/api/ci',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const handleRefresh = () => {
    mutate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-zinc-500" />
            CI PIPELINE DASHBOARD
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            {data?.queue.length || 0} pending · {data?.activeBuild ? '1 active' : '0 active'} · {data?.health.successRate || 100}% success rate
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Loading CI data...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Queue & Active Build */}
            <div className="space-y-4">
              {/* Active Build */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Active Build
                </h3>
                {data.activeBuild ? (
                  <div className="border border-zinc-200 bg-zinc-50 dark:bg-zinc-950/30 dark:border-zinc-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
                      <Badge variant="outline" className="text-xs text-zinc-900 border-zinc-200">
                        RUNNING
                      </Badge>
                      {data.activeBuild.agent && (
                        <Badge variant="outline" className="text-xs text-zinc-600">
                          {data.activeBuild.agent}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {data.activeBuild.spec}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>Started {new Date(data.activeBuild.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-center">
                    <Cpu className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No active builds</p>
                  </div>
                )}
              </div>

              {/* Build Queue */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Build Queue ({data.queue.length} pending)
                </h3>
                {data.queue.length === 0 ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-500">Queue is empty</p>
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    {data.queue.slice(0, 5).map((item) => (
                      <QueueItem key={item.id} item={item} />
                    ))}
                    {data.queue.length > 5 && (
                      <div className="px-3 py-2 text-xs text-zinc-500 text-center border-t border-zinc-200 dark:border-zinc-800">
                        +{data.queue.length - 5} more specs
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Builds & Health */}
            <div className="space-y-4">
              {/* Pipeline Health */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Pipeline Health
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">Success Rate</span>
                    </div>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {data.health.successRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Total</span>
                      <span className="font-medium">{data.health.totalBuilds}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Success</span>
                      <span className="font-medium text-zinc-900">{data.health.successCount}</span>
                    </div>
                  </div>
                  {Object.keys(data.health.failuresByProject).length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Failures by Project</p>
                      <div className="space-y-1">
                        {Object.entries(data.health.failuresByProject).map(([project, count]) => (
                          <div key={project} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-600">{project}</span>
                            <span className="font-medium text-zinc-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Builds */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Recent Builds
                </h3>
                {data.recentBuilds.length === 0 ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-500">No recent builds</p>
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    {data.recentBuilds.slice(0, 5).map((build) => (
                      <BuildRow key={build.id} build={build} />
                    ))}
                    {data.recentBuilds.length > 5 && (
                      <div className="px-3 py-2 text-xs text-zinc-500 text-center border-t border-zinc-200 dark:border-zinc-800">
                        +{data.recentBuilds.length - 5} more builds
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {data && (
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span>Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${priorityColors[item.priority]}`}>
          {item.priority}
        </Badge>
        <p className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {item.title}
        </p>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-zinc-500">
          Risk: <span className={riskColors[item.riskLevel]}>{item.riskLevel}</span>
        </span>
        <span className="text-xs text-zinc-500">{item.createdAt}</span>
      </div>
    </div>
  );
}

function BuildRow({ build }: { build: CIBuild }) {
  const isSuccess = build.status === 'success';
  const isFailed = build.status === 'failed';

  return (
    <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <div className="flex items-start gap-2">
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
          <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {build.spec}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            {build.project && <span>{build.project}</span>}
            {build.testStatus && (
              <>
                <span>•</span>
                <span className={build.testStatus === 'pass' ? 'text-zinc-900' : 'text-zinc-500'}>
                  TEST: {build.testStatus.toUpperCase()}
                </span>
              </>
            )}
            {build.agent && (
              <>
                <span>•</span>
                <span>{build.agent}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
