"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentDetails } from "./agent-details";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgentIcon } from "@/lib/agent-icons";
import { Circle, ChevronRight, ChevronDown } from "lucide-react";

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
  online: "bg-zinc-100 text-zinc-800",
  offline: "bg-zinc-100 text-zinc-800",
  busy: "bg-zinc-100 text-zinc-800",
};

const statusDotColors = {
  online: "fill-[#F5D547] text-zinc-500",
  offline: "fill-zinc-300 text-foreground",
  busy: "fill-zinc-400 text-zinc-400",
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
          {/* Icon */}
          <div className="flex items-center justify-center">
            <AgentIcon emoji={agent.emoji} size={32} className="text-muted-foreground" />
          </div>

          {/* Name and Model */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900">{agent.name}</h3>
              <Badge
                variant="secondary"
                className={cn("text-xs flex items-center gap-1", statusColors[agent.status])}
              >
                <Circle size={8} className={statusDotColors[agent.status]} />
                {agent.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{agent.model}</p>
          </div>

          {/* Expand indicator */}
          <div className="text-muted-foreground transition-transform duration-200">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
