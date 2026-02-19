"use client";

import { Shield } from "lucide-react";

type PermissionMatrixProps = {
  permissions: Record<string, Record<string, boolean>>;
  onPermissionChange: (agentId: string, tool: string, granted: boolean) => void;
};

const ALL_TOOLS = ["exec", "message", "read", "write", "web_search", "web_fetch"];

export function PermissionMatrix({ permissions, onPermissionChange }: PermissionMatrixProps) {
  const agents = Object.keys(permissions);

  if (!permissions || Object.keys(permissions).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 mb-2">
          <Shield size={18} />
          Agent Permissions
        </h3>
        <p className="text-muted-foreground text-sm">No permission data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 mb-2">
        <Shield size={18} />
        Agent Permissions
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Toggle to grant/revoke tool access</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Agent</th>
              {ALL_TOOLS.map((tool) => (
                <th key={tool} className="text-center py-2 px-2 font-medium text-muted-foreground">
                  {tool}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((agentId) => (
              <tr key={agentId} className="border-t border-zinc-100">
                <td className="py-2 px-2 font-medium text-zinc-900">{agentId}</td>
                {ALL_TOOLS.map((tool) => {
                  const granted = permissions[agentId]?.[tool] ?? true;
                  return (
                    <td key={tool} className="py-2 px-2 text-center">
                      <button
                        onClick={() => onPermissionChange(agentId, tool, !granted)}
                        className={`
                          w-6 h-6 rounded transition-colors
                          ${granted ? "bg-zinc-500 text-foreground" : "bg-zinc-200 text-muted-foreground"}
                        `}
                      >
                        {granted ? "✓" : "✗"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
