"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Clock } from "lucide-react";
import useSWR from "swr";

interface BugStatsResponse {
  data?: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    open: number;
    resolved: number;
    closed: number;
    averageResolutionTime: number;
  };
  error?: string;
}

async function fetcher(url: string): Promise<BugStatsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-zinc-500",
  high: "bg-zinc-500",
  medium: "bg-zinc-500",
  low: "bg-zinc-500",
};

export function BugStats() {
  const { data, error, isLoading } = useSWR<BugStatsResponse>(
    '/api/bugs/stats',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  const stats = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bug className="h-5 w-5" />
          BUG STATISTICS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Loading bug statistics...
          </div>
        ) : error || !stats ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error loading bug statistics
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-2xl font-bold text-zinc-500">
                  {stats.open}
                </p>
                <p className="text-xs text-zinc-700 font-medium">
                  Open
                </p>
              </div>
              <div className="text-center p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-2xl font-bold text-zinc-900">
                  {stats.resolved}
                </p>
                <p className="text-xs text-zinc-700 font-medium">
                  Resolved
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-600">
                  {stats.closed}
                </p>
                <p className="text-xs text-gray-700 font-medium">
                  Closed
                </p>
              </div>
            </div>

            {/* Total Bugs */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <span className="text-sm text-zinc-600">Total Bugs</span>
              <span className="text-xl font-bold text-zinc-900">
                {stats.total}
              </span>
            </div>

            {/* By Priority */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">
                By Priority
              </p>
              {['critical', 'high', 'medium', 'low'].map((priority) => {
                const count = stats.byPriority[priority] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={priority} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority]}`} />
                    <span className="text-xs capitalize flex-1">{priority}</span>
                    <span className="text-xs font-medium text-zinc-600">
                      {count}
                    </span>
                    <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${PRIORITY_COLORS[priority]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Average Resolution Time */}
            {stats.averageResolutionTime > 0 && (
              <div className="pt-3 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs text-zinc-600">
                      Avg. Resolution Time
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {stats.averageResolutionTime < 24
                      ? `${Math.round(stats.averageResolutionTime * 10) / 10}h`
                      : `${Math.round(stats.averageResolutionTime / 24 * 10) / 10}d`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
