"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TokenConsumer } from "@/lib/tokens/types";

interface TopConsumersListProps {
  consumers: TokenConsumer[];
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
};

const getSessionTypeColor = (type: string): string => {
  switch (type) {
    case "main":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "cron":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "subagent":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400";
  }
};

export function TopConsumersList({ consumers }: TopConsumersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Token Consumers</CardTitle>
      </CardHeader>
      <CardContent>
        {consumers.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
            No token usage data yet
          </div>
        ) : (
          <div className="space-y-3">
            {consumers.slice(0, 10).map((consumer, index) => (
              <div
                key={consumer.sessionId}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getSessionTypeColor(
                        consumer.sessionType
                      )}`}
                    >
                      {consumer.sessionType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {consumer.label}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTimestamp(consumer.timestamp)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatTokens(consumer.totalTokens)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatCost(consumer.totalCost)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
