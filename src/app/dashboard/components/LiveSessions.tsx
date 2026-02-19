"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useSessions } from "../hooks/useSessions";

export function LiveSessions() {
  const { sessions, lastUpdated, activeCount } = useSessions("all");

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  };

  const getStatusDot = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-zinc-500";
      case "building":
        return "bg-yellow-500";
      case "complete":
        return "bg-zinc-400";
      case "error":
        return "bg-zinc-500";
      default:
        return "bg-zinc-400";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "building":
        return "BUILDING";
      case "complete":
        return "COMPLETE";
      case "error":
        return "ERROR";
      default:
        return "UNKNOWN";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            ACTIVE SESSIONS ({activeCount})
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">All quiet</p>
            <p className="text-xs text-zinc-400 mt-1">No active sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.key}
                className="border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{session.agentEmoji}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {session.displayName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.model} · Tokens: {formatTokenCount(session.tokenUsage)} · Duration:{" "}
                        {formatDuration(session.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusDot(session.status)}`} />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(session.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 bg-zinc-50 rounded p-2">
                  {session.task ? (
                    <div>
                      <p className="font-medium text-zinc-700 mb-1">Task:</p>
                      <p>{session.task}</p>
                    </div>
                  ) : (
                    <p>{session.lastMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
