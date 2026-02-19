"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface SlowTask {
  title: string;
  type: string;
  duration: number | null;
  timestamp: string;
}

const typeColors: Record<string, string> = {
  task: "bg-zinc-100 text-zinc-800",
  message: "bg-zinc-100 text-zinc-800",
  cron: "bg-zinc-100 text-zinc-800",
  file: "bg-zinc-100 text-zinc-800",
  search: "bg-zinc-100 text-zinc-800",
  spawn: "bg-zinc-100 text-zinc-800",
};

export function SlowTasks({ tasks }: { tasks: SlowTask[] }) {
  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock size={16} />
            Slowest Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No duration data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock size={16} />
          Slowest Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-0"
            >
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${typeColors[task.type] || "bg-zinc-100 text-zinc-800"}`}
                  >
                    {task.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(task.timestamp)}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold text-zinc-500">
                {formatDuration(task.duration)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
