"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentDetails } from "./agent-details";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

interface AgentCardProps {
  agent: Agent;
}

const statusColors = {
  online: "bg-green-100 text-green-800",
  offline: "bg-zinc-100 text-zinc-800",
  busy: "bg-yellow-100 text-yellow-800",
};

const statusDots = {
  online: "●",
  offline: "○",
  busy: "◐",
};

export function AgentCard({ agent }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        expanded && "ring-2 ring-zinc-200"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          {/* Emoji */}
          <div className="text-3xl">{agent.emoji}</div>

          {/* Name and Model */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900">{agent.name}</h3>
              <Badge
                variant="secondary"
                className={cn("text-xs", statusColors[agent.status])}
              >
                <span className="mr-1">{statusDots[agent.status]}</span>
                {agent.status}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 font-mono">{agent.model}</p>
          </div>

          {/* Expand indicator */}
          <div className="text-zinc-400 transition-transform duration-200">
            {expanded ? "▼" : "▶"}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <span>{agent.tasksToday} tasks today</span>
          <span>·</span>
          <span>{agent.tokensUsed.toLocaleString()} tokens</span>
        </div>

        {/* Expandable details */}
        {expanded && <AgentDetails agent={agent} />}
      </CardContent>
    </Card>
  );
}
