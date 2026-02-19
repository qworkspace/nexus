"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, FileText, Search, BarChart3, Terminal } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  action: () => void;
  shortcut?: string;
}

const quickActions: QuickAction[] = [
  {
    icon: RefreshCw,
    label: "Refresh All",
    action: () => {
      window.location.reload();
    },
    shortcut: "R",
  },
  {
    icon: Plus,
    label: "Spawn Agent",
    action: () => {
      // Would open spawn agent modal
      console.log("Spawn agent");
    },
    shortcut: "A",
  },
  {
    icon: FileText,
    label: "New Spec",
    action: () => {
      window.open("/search", "_blank");
    },
    shortcut: "S",
  },
  {
    icon: Search,
    label: "Search Memory",
    action: () => {
      window.location.href = "/memory";
    },
    shortcut: "/",
  },
  {
    icon: BarChart3,
    label: "Daily Report",
    action: () => {
      window.location.href = "/analytics";
    },
    shortcut: "D",
  },
];

export function QuickActionsBar() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check for shortcuts
      const action = quickActions.find((a) => a.shortcut === e.key.toUpperCase());
      if (action) {
        e.preventDefault();
        action.action();
      }

      // Toggle shortcuts hint with ?
      if (e.key === "?") {
        setShowShortcuts(!showShortcuts);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  return (
    <div className="bg-zinc-50 border-y border-zinc-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">
            Quick Actions:
          </span>
          <div className="flex items-center gap-1">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 hover:bg-zinc-200"
                onClick={action.action}
                title={`${action.label} (${action.shortcut})`}
              >
                <action.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{action.label}</span>
                {action.shortcut && (
                  <kbd className="hidden md:inline-flex items-center rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 font-mono">
                    {action.shortcut}
                  </kbd>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1.5 hover:bg-zinc-200"
            onClick={() => window.location.href = "/crons"}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cron Jobs</span>
          </Button>

          {showShortcuts && (
            <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg">
              <p className="text-xs font-semibold mb-2 text-zinc-700">
                Keyboard Shortcuts
              </p>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <div
                    key={action.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-600">
                      {action.label}
                    </span>
                    <kbd className="inline-flex items-center rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 font-mono">
                      {action.shortcut}
                    </kbd>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-600">
                    Toggle shortcuts
                  </span>
                  <kbd className="inline-flex items-center rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 font-mono">
                    ?
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
