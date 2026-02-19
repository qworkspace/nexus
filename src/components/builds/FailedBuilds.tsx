"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildSession } from "@/lib/build-mock";
import { XCircle, X } from "lucide-react";

interface FailedBuildsProps {
  builds: BuildSession[];
}

export function FailedBuilds({ builds }: FailedBuildsProps) {
  if (builds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle size={18} className="text-red-600" />
          Failed Builds
        </CardTitle>
      </CardHeader>
      <CardContent>
        {builds.map((build) => (
          <div
            key={build.id}
            className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900">
                    {build.label}
                  </h3>
                  <Badge className="bg-red-500 hover:bg-red-600 text-xs flex items-center gap-1">
                    <X size={12} />
                    FAILED
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {build.task}
                </p>
              </div>
              {build.completedAt && (
                <div className="text-xs text-muted-foreground shrink-0 text-right">
                  {build.completedAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>

            {/* Error message */}
            {build.error && (
              <div className="bg-red-100 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800 font-mono text-xs">
                  {build.error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                View
              </Button>
              <Button variant="default" size="sm" className="h-8 text-xs">
                Respawn
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
