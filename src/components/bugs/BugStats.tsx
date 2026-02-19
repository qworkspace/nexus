"use client";

import { BugStats as BugStatsType } from '@/lib/bugs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface BugStatsProps {
  stats: BugStatsType;
}

export function BugStats({ stats }: BugStatsProps) {
  const SEVERITY_COLORS = {
    critical: 'text-zinc-500 bg-zinc-50',
    high: 'text-zinc-500 bg-zinc-50',
    medium: 'text-zinc-600 bg-zinc-100',
    low: 'text-gray-600 bg-gray-50',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Bug Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total bugs */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {stats.open}
            </span>
            <span className="text-sm text-muted-foreground">
              / {stats.total} total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Open bugs
          </p>
        </div>

        {/* Severity breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-700 uppercase tracking-wide">
            By Severity
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-700">Critical</span>
              </div>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS.critical}`}>
                {stats.critical}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-700">High</span>
              </div>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS.high}`}>
                {stats.high}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-700">Medium</span>
              </div>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS.medium}`}>
                {stats.medium}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-zinc-700">Low</span>
              </div>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS.low}`}>
                {stats.low}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed this week */}
        {stats.fixedThisWeek > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Fixed this week
              </span>
              <span className="text-sm font-semibold text-zinc-900">
                {stats.fixedThisWeek}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
