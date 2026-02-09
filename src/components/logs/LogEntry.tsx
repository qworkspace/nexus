"use client";

import { Badge } from "@/components/ui/badge";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  raw: string;
}

const LEVEL_COLORS = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warn: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  debug: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface LogEntryProps {
  log: LogEntry;
}

export function LogEntry({ log }: LogEntryProps) {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // If less than 1 minute, show seconds
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`;
    }
    // If less than 1 hour, show minutes
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    }
    // Otherwise show time
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-zinc-900/50 rounded-lg group transition-colors font-mono text-sm">
      {/* Timestamp */}
      <span className="text-zinc-500 text-xs shrink-0 w-20">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Level Badge */}
      <Badge
        variant="outline"
        className={`shrink-0 ${LEVEL_COLORS[log.level]}`}
      >
        {log.level.toUpperCase()}
      </Badge>

      {/* Source Badge */}
      <Badge
        variant="outline"
        className="shrink-0 capitalize bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
      >
        {log.source}
      </Badge>

      {/* Message */}
      <span className="text-zinc-300 flex-1 break-words">
        {log.message}
      </span>
    </div>
  );
}
