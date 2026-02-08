"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCommandStore } from "@/stores/commandStore";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
  action: () => void;
}

interface QuickActionsBarProps {
  onRefresh?: () => void;
}

export function QuickActionsBar({ onRefresh }: QuickActionsBarProps) {
  const router = useRouter();
  const { openSpawn, openPalette } = useCommandStore();

  const actions: QuickAction[] = [
    {
      id: "refresh",
      label: "Refresh All",
      icon: "↻",
      shortcut: "R",
      action: () => {
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      },
    },
    {
      id: "spawn",
      label: "Spawn Agent",
      icon: "🤖",
      shortcut: "A",
      action: openSpawn,
    },
    {
      id: "spec",
      label: "New Spec",
      icon: "📝",
      shortcut: "S",
      action: () => router.push("/specs/new"),
    },
    {
      id: "search",
      label: "Search",
      icon: "⌕",
      shortcut: "/",
      action: openPalette,
    },
    {
      id: "report",
      label: "Daily Report",
      icon: "📊",
      shortcut: "D",
      action: () => router.push("/analytics"),
    },
  ];

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50">
      <span className="text-xs text-zinc-500 mr-2">Quick Actions:</span>
      {actions.map(action => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          onClick={action.action}
          className={cn(
            "h-8 px-3 gap-2 text-sm",
            "hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80",
            "transition-all duration-150"
          )}
        >
          <span>{action.icon}</span>
          <span className="hidden sm:inline">{action.label}</span>
          <kbd className="hidden md:inline ml-1 text-xs text-zinc-400 px-1.5 py-0.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded">
            {action.shortcut}
          </kbd>
        </Button>
      ))}
    </div>
  );
}
