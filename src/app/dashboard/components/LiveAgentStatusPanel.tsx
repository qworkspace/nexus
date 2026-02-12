"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, X, FileText, Plus, Circle } from "lucide-react";
import useSWR from "swr";

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

interface AgentStatusResponse {
  source: 'live' | 'mock' | 'error';
  agents: AgentSession[];
  queue: { id: string; spec: string; priority: number }[];
  recentCompletions: { id: string; label: string; completedAt: string; commitUrl?: string }[];
  error?: string;
}

async function fetcher(url: string): Promise<AgentStatusResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const MODEL_LABELS: Record<string, string> = {
  'claude-opus-4-5': 'Opus',
  'claude-sonnet-4': 'Sonnet',
  'claude-3-5-sonnet': 'Sonnet 3.5',
  'glm-4.7': 'GLM-4.7',
  'glm-4-flash': 'GLM-4',
};

export function LiveAgentStatusPanel() {
  const { data, mutate } = useSWR<AgentStatusResponse>(
    '/api/agents/status',
    fetcher,
    {
      refreshInterval: 10000, // 10-second refresh
      revalidateOnFocus: false,
    }
  );

  const agents = data?.agents || [];
  const queue = data?.queue || [];
  const recentCompletions = data?.recentCompletions || [];

  const getModelLabel = (model: string): string => {
    return MODEL_LABELS[model] || model;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-zinc-400';
      case 'completed':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-zinc-400';
    }
  };

  const getStatusDot = (status: string): JSX.Element => {
    switch (status) {
      case 'active':
        return <Circle size={8} className="fill-green-500 text-green-500" />;
      case 'idle':
        return <Circle size={8} className="fill-zinc-400 text-zinc-400" />;
      case 'completed':
        return <Circle size={8} className="fill-blue-500 text-blue-500" />;
      case 'error':
        return <Circle size={8} className="fill-red-500 text-red-500" />;
      default:
        return <Circle size={8} className="fill-zinc-400 text-zinc-400" />;
    }
  };

  const formatTokens = (tokens?: number): string => {
    if (!tokens) return '0';
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  const formatDuration = (startedAt: string): string => {
    const diffMs = Date.now() - new Date(startedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${Math.floor(diffMs / 1000)}s`;
  };

  const handleSpawnAgent = () => {
    // Would open spawn agent modal
    console.log("Spawn agent");
  };

  const handleKillAgent = (id: string) => {
    // Would call API to kill agent
    console.log("Kill agent:", id);
    mutate();
  };

  const handleViewLogs = (id: string) => {
    // Would open logs viewer
    console.log("View logs:", id);
  };

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'idle');
  const completedCount = agents.filter(a => a.status === 'completed').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            AGENT STATUS ({activeAgents.length})
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Queue: {queue.length} pending · Done: {completedCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSpawnAgent}
          >
            <Plus className="h-4 w-4 mr-2" />
            Spawn
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Active Agents */}
          {activeAgents.length === 0 && queue.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">All quiet</p>
              <p className="text-xs text-zinc-400 mt-1">No active agents or queued tasks</p>
            </div>
          ) : (
            <>
              {activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {agent.label}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {getModelLabel(agent.model)} · Tokens: {formatTokens(agent.tokensUsed)} · {formatDuration(agent.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getStatusDot(agent.status)} {agent.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {agent.currentTask && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded p-2 mb-2">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Task:</p>
                      <p>{agent.currentTask}</p>
                      {agent.progress !== undefined && (
                        <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleViewLogs(agent.id)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Logs
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleKillAgent(agent.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Kill
                    </Button>
                  </div>
                </div>
              ))}

              {/* Queued Tasks */}
              {queue.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Queue ({queue.length})
                  </p>
                  <div className="space-y-1.5">
                    {queue.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-sm py-1 px-2 bg-zinc-50 dark:bg-zinc-900 rounded"
                      >
                        <Play className="h-3 w-3 text-zinc-400" />
                        <span className="text-zinc-600 dark:text-zinc-400 flex-1">
                          {task.spec}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Priority {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Completions */}
              {recentCompletions.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Recent Completions
                  </p>
                  <div className="space-y-1">
                    {recentCompletions.slice(0, 3).map((completion) => (
                      <div
                        key={completion.id}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {completion.label}
                        </span>
                        {completion.commitUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600"
                            onClick={() => window.open(completion.commitUrl, '_blank')}
                          >
                            View Commit
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
