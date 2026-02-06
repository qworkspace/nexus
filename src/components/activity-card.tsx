"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  title: string;
  description: string | null;
  metadata: string | null;
  duration: number | null;
  status: string;
}

const typeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-800",
  message: "bg-purple-100 text-purple-800",
  cron: "bg-orange-100 text-orange-800",
  file: "bg-green-100 text-green-800",
  search: "bg-cyan-100 text-cyan-800",
  spawn: "bg-pink-100 text-pink-800",
};

const typeIcons: Record<string, string> = {
  task: "◉",
  message: "◈",
  cron: "◎",
  file: "◫",
  search: "⌕",
  spawn: "◇",
};

const statusIcons: Record<string, string> = {
  success: "✓",
  error: "✗",
  pending: "◌",
};

const statusColors: Record<string, string> = {
  success: "text-green-600",
  error: "text-red-600",
  pending: "text-yellow-600",
};

function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  const metadata = activity.metadata ? JSON.parse(activity.metadata) : null;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        expanded && "ring-2 ring-zinc-200"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          <div
            className={cn(
              "text-lg font-bold mt-0.5",
              statusColors[activity.status]
            )}
          >
            {statusIcons[activity.status] || "○"}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={cn("text-xs", typeColors[activity.type])}
              >
                <span className="mr-1">{typeIcons[activity.type] || "○"}</span>
                {activity.type}
              </Badge>
              <span className="text-xs text-zinc-400">{activity.action}</span>
              {activity.duration && (
                <span className="text-xs text-zinc-400">
                  · {formatDuration(activity.duration)}
                </span>
              )}
            </div>

            <h3 className="font-medium text-zinc-900 mb-1">{activity.title}</h3>

            {activity.description && !expanded && (
              <p className="text-sm text-zinc-500 truncate">
                {activity.description}
              </p>
            )}

            {expanded && (
              <div className="mt-3 space-y-2">
                {activity.description && (
                  <p className="text-sm text-zinc-600">{activity.description}</p>
                )}
                {metadata && (
                  <pre className="text-xs bg-zinc-50 p-2 rounded-md overflow-x-auto text-zinc-600">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-zinc-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Time */}
          <div className="text-xs text-zinc-400 whitespace-nowrap">
            {formatRelativeTime(activity.timestamp)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
