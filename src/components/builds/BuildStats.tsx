"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildStats as BuildStatsType } from "@/lib/build-mock";
import { formatDuration } from "@/lib/build-mock";

interface BuildStatsProps {
  stats: BuildStatsType;
}

export function BuildStats({ stats }: BuildStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Today&apos;s Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Builds Completed */}
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-zinc-900">
              {stats.completedToday}
            </div>
            <div className="text-xs text-zinc-500">Builds Completed</div>
          </div>

          {/* Currently Building */}
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-zinc-900">
              {stats.currentlyBuilding}
            </div>
            <div className="text-xs text-zinc-500">Currently Building</div>
          </div>

          {/* Queue Size */}
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-zinc-900">
              {stats.queueSize}
            </div>
            <div className="text-xs text-zinc-500">Queue Size</div>
          </div>

          {/* Success Rate */}
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-zinc-900">
              {stats.successRate.toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-500">Success Rate</div>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="space-y-3 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Avg Duration</span>
            <span className="text-sm font-medium text-zinc-900">
              {formatDuration(Math.floor(stats.avgDuration))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Total Time</span>
            <span className="text-sm font-medium text-zinc-900">
              {formatDuration(Math.floor(stats.totalTimeToday))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Most Productive Hour</span>
            <span className="text-sm font-medium text-zinc-900">
              {stats.mostProductiveHour} ({stats.buildsInPeakHour} builds)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
