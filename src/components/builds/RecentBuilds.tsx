"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildSession } from "@/lib/build-mock";
import { formatDuration } from "@/lib/build-mock";

interface RecentBuildsProps {
  builds: BuildSession[];
}

export function RecentBuilds({ builds }: RecentBuildsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            ✅ Recent Completions (Today)
          </span>
          <Badge variant="secondary" className="text-xs">{builds.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {builds.length === 0 ? (
          <p className="text-sm text-zinc-500">No completed builds today</p>
        ) : (
          <div className="space-y-2">
            {builds.map((build) => (
              <div
                key={build.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {/* Time */}
                <div className="w-20 text-sm text-zinc-500 shrink-0">
                  {build.completedAt?.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 truncate">
                    {build.label}
                  </div>
                  {build.result && (
                    <div className="text-xs text-zinc-500 truncate">
                      {build.result}
                    </div>
                  )}
                </div>

                {/* Status and Duration */}
                <div className="flex items-center gap-4 shrink-0">
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    ✓ SUCCESS
                  </Badge>
                  <div className="text-sm text-zinc-600 w-20 text-right">
                    {build.duration && formatDuration(build.duration)}
                  </div>
                </div>
              </div>
            ))}

            {/* View All Link */}
            <div className="pt-3 mt-3 border-t border-zinc-200">
              <Button variant="ghost" className="w-full text-sm text-zinc-600 hover:text-zinc-900">
                View All History →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
