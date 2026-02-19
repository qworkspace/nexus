"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useCommandStore } from "@/stores/commandStore";
import { Bot, Check} from "lucide-react";

interface AgentSession {
  id: string;
  label: string;
  model: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  startedAt: string;
  tokensUsed?: number;
  currentTask?: string;
  progress?: number;
  channel?: string;
}

interface AgentStatusData {
  source: string;
  agents: AgentSession[];
  queue: { id: string; spec: string; priority: number }[];
  recentCompletions: { id: string; label: string; completedAt: string; commitUrl?: string }[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const statusConfig = {
  active: { color: "bg-zinc-800", glow: "status-glow-green", label: "Active" },
  idle: { color: "bg-yellow-500", glow: "status-glow-yellow", label: "Idle" },
  completed: { color: "bg-zinc-900", glow: "status-glow-blue", label: "Done" },
  error: { color: "bg-red-500", glow: "status-glow-red", label: "Error" },
};

function formatDuration(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTokens(tokens?: number): string {
  if (!tokens) return "0";
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

export function AgentStatusPanel() {
  const { data, isLoading } = useSWR<AgentStatusData>(
    "/api/agents/status",
    fetcher,
    { refreshInterval: 5000 }
  );
  const { openSpawn } = useCommandStore();

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bot size={20} className="text-zinc-600 dark:text-zinc-300" />
          Live Agents
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openSpawn}
          className="text-xs"
        >
          + Spawn Agent
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Agents */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.agents.map(agent => {
              const status = statusConfig[agent.status];
              return (
                <div
                  key={agent.id}
                  className={cn(
                    "p-3 rounded-lg border bg-white dark:bg-zinc-900/50 dark:border-zinc-800",
                    agent.status === 'active' && "border-zinc-300 dark:border-zinc-300/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", status.color, agent.status === 'active' && "animate-pulse-soft")} />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {agent.label}
                      </span>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {agent.model.replace('claude-', '').replace('anthropic/', '')}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDuration(agent.startedAt)}
                    </span>
                  </div>
                  
                  {agent.currentTask && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 truncate">
                      {agent.currentTask}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {agent.progress !== undefined && (
                      <div className="flex-1">
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zinc-800 rounded-full transition-all duration-500"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span>{formatTokens(agent.tokensUsed)} tokens</span>
                    {agent.channel && (
                      <span className="text-zinc-400">via {agent.channel}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Queue */}
        {data?.queue && data?.queue?.length > 0 && (
          <div className="pt-3 border-t dark:border-zinc-800">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Queue ({data?.queue?.length || 0})
            </h4>
            <div className="space-y-1">
              {(data?.queue || []).slice(0, 3).map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">{i + 1}.</span>
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">
                    {item.spec}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completions */}
        {data?.recentCompletions && data?.recentCompletions?.length > 0 && (
          <div className="pt-3 border-t dark:border-zinc-800">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Recent Completions
            </h4>
            <div className="space-y-1">
              {(data?.recentCompletions || []).slice(0, 3).map(completion => (
                <div key={completion.id} className="flex items-center gap-2 text-sm">
                  <Check size={16} />
                  <span className="text-zinc-600 dark:text-zinc-400 truncate flex-1">
                    {completion.label}
                  </span>
                  {completion.commitUrl && (
                    <a
                      href={completion.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-600 text-xs"
                    >
                      commit →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
