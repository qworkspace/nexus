"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, CheckCircle, AlertTriangle, HardDrive } from "lucide-react";

interface BackupStatsProps {
  totalRepos: number;
  healthy: number;
  warning: number;
  error: number;
  totalSize: string;
}

export function BackupStats({
  totalRepos,
  healthy,
  warning,
  error,
  totalSize,
}: BackupStatsProps) {
  const healthPercentage = totalRepos > 0 ? (healthy / totalRepos) * 100 : 0;
  const hasIssues = warning + error > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Backup Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Status */}
        <div className="bg-zinc-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-700">Overall Health</span>
            <div className="flex items-center gap-2">
              {hasIssues ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm font-semibold ${hasIssues ? 'text-yellow-600' : 'text-green-600'}`}>
                {hasIssues ? 'Attention Needed' : 'All Good'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                healthPercentage === 100 ? 'bg-green-500' :
                healthPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-600">
            <span>{healthy} healthy</span>
            <span>{healthPercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Status Counts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Healthy</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{healthy}</div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Issues</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{error + warning}</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="space-y-2 pt-2 border-t border-zinc-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-600">
              <Database className="h-4 w-4" />
              <span>Total Repositories</span>
            </div>
            <span className="font-medium text-zinc-900">{totalRepos}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-600">
              <HardDrive className="h-4 w-4" />
              <span>Total Size</span>
            </div>
            <span className="font-medium text-zinc-900">{totalSize}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
