"use client";

import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type AuditLogEntry = {
  id: string;
  timestamp: string;
  agentId: string;
  tool: string;
  action: string;
  result: string;
  durationMs?: number;
};

type AuditLogProps = {
  logs: AuditLogEntry[];
  selectedAgent: string | null;
  onAgentFilter: (agentId: string | null) => void;
};

export function AuditLog({ logs, selectedAgent, onAgentFilter }: AuditLogProps) {
  const filteredLogs = selectedAgent
    ? logs.filter((log) => log.agentId === selectedAgent)
    : logs;

  if (!logs) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground flex items-center gap-2">
          <Clock size={18} />
          Audit Log
        </h3>
        <p className="text-muted-foreground text-sm">Loading audit logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground flex items-center gap-2">
          <Clock size={18} />
          Audit Log
        </h3>
        <p className="text-muted-foreground text-sm">No audit log entries found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground flex items-center gap-2 mb-4">
        <Clock size={18} />
        Audit Log
      </h3>
      {selectedAgent && (
        <p className="text-xs text-muted-foreground mb-2">
          Filtered by: <span className="font-medium">{selectedAgent}</span>
          <button
            onClick={() => onAgentFilter(null)}
            className="ml-2 text-zinc-900 hover:text-zinc-700"
          >
            Clear filter
          </button>
        </p>
      )}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredLogs.map((log) => {
          const Icon =
            log.result === "success"
              ? CheckCircle
              : log.result === "error"
              ? XCircle
              : AlertCircle;
          const iconColor =
            log.result === "success"
              ? "text-zinc-500"
              : log.result === "error"
              ? "text-zinc-500"
              : "text-yellow-500";

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-secondary border border-zinc-100 dark:border-border"
            >
              <Icon size={14} className={`${iconColor} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-foreground">{log.agentId}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-zinc-700 dark:text-foreground">{log.tool}</span>
                </div>
                <p className="text-xs text-muted-foreground">{log.action}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  {log.durationMs && (
                    <span>{(log.durationMs / 1000).toFixed(2)}s</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
