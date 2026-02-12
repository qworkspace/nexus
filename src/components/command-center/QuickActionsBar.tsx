"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCommandStore } from "@/stores/commandStore";
import { useRouter } from "next/navigation";
import { RefreshCw, Bot, FileText, Search, BookOpen, BarChart3 } from "lucide-react";

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

  const actionIcons: Record<string, JSX.Element> = {
    refresh: <RefreshCw size={14} />,
    spawn: <Bot size={14} />,
    spec: <FileText size={14} />,
    search: <Search size={14} />,
    lessons: <BookOpen size={14} />,
    report: <BarChart3 size={14} />,
  };

  const actions: QuickAction[] = [
    {
      id: "refresh",
      label: "Refresh All",
      icon: "refresh",
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
      icon: "spawn",
      shortcut: "A",
      action: openSpawn,
    },
    {
      id: "spec",
      label: "New Spec",
      icon: "spec",
      shortcut: "S",
      action: () => router.push("/specs/new"),
    },
    {
      id: "search",
      label: "Search",
      icon: "search",
      shortcut: "/",
      action: openPalette,
    },
    {
      id: "lessons",
      label: "Lessons",
      icon: "lessons",
      shortcut: "L",
      action: () => router.push("/lessons"),
    },
    {
      id: "report",
      label: "Daily Report",
      icon: "report",
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
          {actionIcons[action.icon]}
          <span className="hidden sm:inline">{action.label}</span>
          <kbd className="hidden md:inline ml-1 text-xs text-zinc-400 px-1.5 py-0.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded">
            {action.shortcut}
          </kbd>
        </Button>
      ))}
    </div>
  );
}
