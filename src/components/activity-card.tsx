"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Circle, Search, Settings, Zap } from "lucide-react";

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
  tokensIn: number | null;
  tokensOut: number | null;
  cost: number | null;
  model: string | null;
}

const typeColors: Record<string, string> = {
  task: "bg-zinc-100 text-zinc-800",
  message: "bg-zinc-100 text-zinc-800",
  cron: "bg-zinc-100 text-zinc-800",
  file: "bg-zinc-100 text-zinc-800",
  search: "bg-zinc-100 text-zinc-800",
  spawn: "bg-zinc-100 text-zinc-800",
  tool: "bg-gray-100 text-gray-800",
  model: "bg-zinc-100 text-zinc-800",
};

const typeIcons: Record<string, string> = {
  task: "◉",
  message: "◈",
  cron: "◎",
  file: "◫",
  search: "search",
  spawn: "◇",
  tool: "tool",
  model: "model",
};

const statusIcons: Record<string, string> = {
  success: "success",
  error: "error",
  pending: "◌",
};

const statusColors: Record<string, string> = {
  success: "text-zinc-900",
  error: "text-zinc-500",
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

function formatTokens(tokens: number | null): string {
  if (!tokens) return "0";
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
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
              "mt-0.5",
              statusColors[activity.status]
            )}
          >
            {statusIcons[activity.status] === "success" ? (
              <Check size={18} />
            ) : statusIcons[activity.status] === "error" ? (
              <X size={18} />
            ) : statusIcons[activity.status] === "◌" ? (
              <span className="text-lg font-bold">◌</span>
            ) : (
              <Circle size={18} />
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={cn("text-xs flex items-center gap-1", typeColors[activity.type])}
              >
                {typeIcons[activity.type] === "search" ? (
                  <Search size={12} />
                ) : typeIcons[activity.type] === "tool" ? (
                  <Settings size={12} />
                ) : typeIcons[activity.type] === "model" ? (
                  <Zap size={12} />
                ) : (
                  <span>{typeIcons[activity.type] || "○"}</span>
                )}
                {activity.type}
              </Badge>
              <span className="text-xs text-muted-foreground">{activity.action}</span>
              {activity.duration && (
                <span className="text-xs text-muted-foreground">
                  · {formatDuration(activity.duration)}
                </span>
              )}
            </div>

            <h3 className="font-medium text-zinc-900 mb-1">{activity.title}</h3>

            {activity.description && !expanded && (
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
            )}

            {expanded && (
              <div className="mt-3 space-y-2">
                {activity.description && (
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                )}
                {metadata && (
                  <pre className="text-xs bg-zinc-50 p-2 rounded-md overflow-x-auto text-muted-foreground">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Time and Cost */}
          <div className="text-right shrink-0">
            {activity.cost !== null && activity.cost > 0 && (
              <div className="text-sm font-semibold text-zinc-700 mb-1">
                ${activity.cost.toFixed(2)}
              </div>
            )}
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </div>
            {activity.model && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {activity.model}
              </div>
            )}
          </div>
        </div>

        {/* Token info when expanded */}
        {expanded && (activity.tokensIn || activity.tokensOut) && (
          <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Tokens: {formatTokens(activity.tokensIn)} in / {formatTokens(activity.tokensOut)} out</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
