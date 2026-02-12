import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  description: string;
  workspace: string;
  status: 'online' | 'offline' | 'busy';
  tasksToday: number;
  tokensUsed: number;
}

interface AgentDetailsProps {
  agent: Agent;
}

export function AgentDetails({ agent }: AgentDetailsProps) {
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
      {/* Description */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-1">Description</h4>
        <p className="text-sm text-zinc-600">{agent.description}</p>
      </div>

      {/* Workspace */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-1">Workspace</h4>
        <code className="text-xs bg-zinc-50 px-2 py-1 rounded text-zinc-600">
          {agent.workspace}
        </code>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-1">Tasks Today</h4>
          <div className="text-2xl font-bold text-zinc-900">{agent.tasksToday}</div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-1">Tokens Used (24h)</h4>
          <div className="text-2xl font-bold text-zinc-900">{formatTokens(agent.tokensUsed)}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-2">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Check size={14} className="text-green-500" />
            <span>Completed code review task</span>
            <span className="text-xs text-zinc-400 ml-auto">2m ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Check size={14} className="text-green-500" />
            <span>Updated documentation</span>
            <span className="text-xs text-zinc-400 ml-auto">15m ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Check size={14} className="text-green-500" />
            <span>Fixed bug in auth module</span>
            <span className="text-xs text-zinc-400 ml-auto">1h ago</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1">
          Spawn Task
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          View Workspace
        </Button>
      </div>
    </div>
  );
}
