"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { BarChart3 } from "lucide-react";

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
  const { data } = useSWR<SessionInsightsData>(
    "/api/session/insights",
    fetcher,
    { refreshInterval: 5000 }
  );

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 size={16} />
          Session Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {data?.today.sessions || 0}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase">Sessions</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatTokens(data?.today.totalTokens || 0)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase">Tokens</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ${data?.today.totalCost.toFixed(2) || '0.00'}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase">Cost</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatDuration(data?.current.durationMs || 0)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase">Duration</p>
          </div>
        </div>

        {/* Session Timeline - Compact */}
        {data?.today?.summaries && data?.today?.summaries?.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
              Today&apos;s Sessions
            </h4>
            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {(data?.today?.summaries || []).slice(0, 6).map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 py-1 text-xs"
                >
                  <span className="text-zinc-400 w-12 text-right font-mono">
                    {formatTime(session.startedAt)}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((session.tokensUsed / (data?.today?.totalTokens || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-zinc-500 w-10 text-right">
                    {formatTokens(session.tokensUsed)}
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
