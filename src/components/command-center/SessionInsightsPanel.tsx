"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  tokensUsed: number;
  cost: number;
  tasksCompleted: number;
  channel: string;
}

interface SessionInsightsData {
  source: string;
  current: {
    startedAt: string;
    durationMs: number;
    tokensUsed: number;
    cost: number;
    model: string;
  };
  today: {
    sessions: number;
    totalTokens: number;
    totalCost: number;
    summaries: SessionSummary[];
  };
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function SessionInsightsPanel() {
  const { data, isLoading } = useSWR<SessionInsightsData>(
    "/api/session/insights",
    fetcher,
    { refreshInterval: 5000 }
  );

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">📊</span>
          Session Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/80 dark:to-zinc-800/50 border dark:border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Current Session
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="text-xs text-green-600 dark:text-green-400">Live</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-16 shimmer rounded-lg" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatDuration(data?.current.durationMs || 0)}
                </div>
                <div className="text-xs text-zinc-500">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatTokens(data?.current.tokensUsed || 0)}
                </div>
                <div className="text-xs text-zinc-500">Tokens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ${data?.current.cost.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-zinc-500">Cost</div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Today&apos;s Summary
            </h4>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              ${data?.today.totalCost.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {data?.today.sessions || 0}
              </div>
              <div className="text-xs text-zinc-500">Sessions</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatTokens(data?.today.totalTokens || 0)}
              </div>
              <div className="text-xs text-zinc-500">Tokens</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {data?.today.summaries.reduce((sum, s) => sum + s.tasksCompleted, 0) || 0}
              </div>
              <div className="text-xs text-zinc-500">Tasks</div>
            </div>
          </div>
        </div>

        {/* Session Timeline */}
        {data?.today.summaries && data.today.summaries.length > 0 && (
          <div className="space-y-2 pt-2 border-t dark:border-zinc-800">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Today&apos;s Sessions
            </h4>
            <div className="space-y-1">
              {data.today.summaries.map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 py-1.5 text-sm"
                >
                  <span className="text-xs text-zinc-400 w-16">
                    {formatTime(session.startedAt)}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((session.tokensUsed / (data.today.totalTokens || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-12 text-right">
                    {formatTokens(session.tokensUsed)}
                  </span>
                  <span className="text-xs text-zinc-400 w-12 text-right">
                    ${session.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
