"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { RefreshCw, Bot, Clock, Zap, Users, Cpu } from "lucide-react";
import type { AgentActivityData, AgentSession } from "@/types/agents";

async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function AgentActivity() {
  const { data, mutate, isLoading } = useSWR<AgentActivityData>(
    '/api/agents/activity',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const handleRefresh = () => {
    mutate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-zinc-500" />
            AGENT ACTIVITY
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            {data?.stats.totalAgents || 0} total · {data?.stats.activeAgents || 0} active · {data?.stats.idleAgents || 0} idle
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Loading agent data...</span>
            </div>
          </div>
        ) : data.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Bot className="h-12 w-12 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-500">No active agents</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column: Stats Overview */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Session Stats
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">Active Agents</span>
                    </div>
                    <span className="text-xl font-bold text-zinc-900">
                      {data.stats.activeAgents}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">Total Sessions</span>
                    </div>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {data.stats.totalAgents}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">Total Tokens</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatTokens(data.stats.totalTokens)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">Longest Run</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {data.stats.longestRunningSession} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Session List (2 cols) */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Active Sessions ({data.sessions.length})
              </h3>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                {data.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {data && data.sessions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span>Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionRow({ session }: { session: AgentSession }) {
  const isActive = session.status === 'active';
  const isIdle = session.status === 'idle';

  const statusColors = isActive
    ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
    : isIdle
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  return (
    <div className="px-3 py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <div className="flex items-start gap-3">
        {/* Agent Emoji */}
        <div className="flex-shrink-0 text-2xl">
          {session.emoji}
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {session.label}
            </p>
            <Badge variant="outline" className={`text-xs ${statusColors}`}>
              {session.status.toUpperCase()}
            </Badge>
          </div>

          {/* Task & Role */}
          <div className="flex items-center gap-2 mb-1">
            {session.currentTask && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                {session.currentTask}
              </p>
            )}
            {session.role && (
              <>
                <span className="text-zinc-400">•</span>
                <p className="text-xs text-zinc-500">
                  {session.role}
                </p>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>{session.model.split('/').pop()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>{formatTokens(session.tokensUsed)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(session.ageMs)}</span>
            </div>
            {session.channel && (
              <>
                <span className="text-zinc-400">•</span>
                <span className="capitalize">{session.channel}</span>
              </>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {isActive ? (
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-500 animate-pulse" />
          ) : isIdle ? (
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
