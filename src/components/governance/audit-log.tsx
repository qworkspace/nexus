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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock size={18} />
          Audit Log
        </h3>
        <p className="text-zinc-500 text-sm">Loading audit logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock size={18} />
          Audit Log
        </h3>
        <p className="text-zinc-500 text-sm">No audit log entries found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
        <Clock size={18} />
        Audit Log
      </h3>
      {selectedAgent && (
        <p className="text-xs text-zinc-500 mb-2">
          Filtered by: <span className="font-medium">{selectedAgent}</span>
          <button
            onClick={() => onAgentFilter(null)}
            className="ml-2 text-blue-600 hover:text-blue-700"
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
              ? "text-green-500"
              : log.result === "error"
              ? "text-red-500"
              : "text-yellow-500";

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
            >
              <Icon size={14} className={`${iconColor} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{log.agentId}</span>
                  <span className="text-zinc-400">→</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{log.tool}</span>
                </div>
                <p className="text-xs text-zinc-500">{log.action}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
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
