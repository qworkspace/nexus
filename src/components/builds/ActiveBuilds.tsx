"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildSession } from "@/lib/build-mock";
import { calculateProgress, formatDuration } from "@/lib/build-mock";
import { useState, useEffect } from "react";

interface ActiveBuildsProps {
  builds: BuildSession[];
}

export function ActiveBuilds({ builds }: ActiveBuildsProps) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // Update progress every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: Record<string, number> = {};
      builds.forEach((build) => {
        if (build.status === 'building' && build.estimatedDuration) {
          newProgress[build.id] = calculateProgress(build.startedAt, build.estimatedDuration);
        }
      });
      setProgressMap(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [builds]);

  const now = new Date();

  if (builds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🔨 Active Builds
            </span>
            <Badge variant="secondary" className="text-xs">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">No builds currently running</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🔨 Active Builds
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{builds.length}</Badge>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Refresh 🔄
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {builds.map((build) => {
          const progress = progressMap[build.id] || 0;
          const elapsed = Math.floor((now.getTime() - build.startedAt.getTime()) / 1000);

          return (
            <div key={build.id} className="border border-zinc-200 rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-900 truncate">
                      {build.label}
                    </h3>
                    <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                      ● BUILDING
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {build.task}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>~{progress.toFixed(0)}% (est)</span>
                  <span>
                    Started: {build.startedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} | Running: {formatDuration(elapsed)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  View Logs
                </Button>
                <Button variant="destructive" size="sm" className="h-8 text-xs">
                  Kill
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
