"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentIcon } from "@/lib/agent-icons";
import { Circle } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: "online" | "busy" | "idle" | "error";
  tasksToday?: number;
}

const AGENTS: Agent[] = [
  { id: "Q", name: "Q", emoji: "🦾", status: "online", tasksToday: 8 },
  { id: "Creative", name: "Creative", emoji: "🎨", status: "idle" },
  { id: "Dev", name: "Dev", emoji: "💻", status: "busy", tasksToday: 3 },
  { id: "Research", name: "Research", emoji: "🔍", status: "idle" },
  { id: "Growth", name: "Growth", emoji: "📈", status: "idle" },
  { id: "Events", name: "Events", emoji: "🎪", status: "idle" },
  { id: "Support", name: "Support", emoji: "💬", status: "idle" },
  { id: "Design", name: "Design", emoji: "🎨", status: "idle" },
  { id: "Testing", name: "Testing", emoji: "🧪", status: "idle" },
];

const getStatusDotColor = (status: string): string => {
  switch (status) {
    case "online":
      return "fill-[#F5D547] text-zinc-500";
    case "busy":
      return "fill-yellow-500 text-yellow-500";
    case "idle":
      return "fill-zinc-400 text-zinc-400";
    case "error":
      return "fill-zinc-500 text-zinc-500";
    default:
      return "fill-zinc-400 text-zinc-400";
  }
};

const getStatusText = (agent: Agent): string => {
  switch (agent.status) {
    case "online":
      return "Online";
    case "busy":
      return agent.tasksToday ? `Busy (${agent.tasksToday} tasks)` : "Busy";
    case "idle":
      return "Idle";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
};

export function AgentFleet() {
  const activeCount = AGENTS.filter((a) => a.status === "online" || a.status === "busy").length;
  const idleCount = AGENTS.filter((a) => a.status === "idle").length;
  const errorCount = AGENTS.filter((a) => a.status === "error").length;
  const tasksToday = AGENTS.reduce((sum, a) => sum + (a.tasksToday || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">AGENT FLEET</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
            >
              <AgentIcon emoji={agent.emoji} size={24} className="text-zinc-600 dark:text-zinc-300" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">{agent.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Circle size={8} className={getStatusDotColor(agent.status)} />
                  <p className="text-xs text-zinc-500">{getStatusText(agent)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Fleet Stats:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-[#F5D547] text-zinc-500" />
                {activeCount} active
              </span>
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-zinc-400 text-zinc-400" />
                {idleCount} idle
              </span>
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-zinc-500 text-zinc-500" />
                {errorCount} errors
              </span>
              <span>{tasksToday} tasks today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
