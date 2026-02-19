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
  info: "bg-[#A8B5A0]/15 text-[#5C6B56] border-[#A8B5A0]/30",
  warn: "bg-[#D4C5A9]/15 text-[#8B7D65] border-[#D4C5A9]/30",
  error: "bg-[#8E99A4]/15 text-[#8E99A4] border-[#8E99A4]/30",
  debug: "bg-zinc-500/10 text-muted-foreground border-zinc-500/20",
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
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-card/80 rounded-lg group transition-colors font-mono text-sm">
      {/* Timestamp */}
      <span className="text-muted-foreground text-xs shrink-0 w-20">
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
        className="shrink-0 capitalize bg-zinc-500/10 text-muted-foreground border-zinc-500/20"
      >
        {log.source}
      </Badge>

      {/* Message */}
      <span className="text-foreground flex-1 break-words">
        {log.message}
      </span>
    </div>
  );
}
