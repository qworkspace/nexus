"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: "◉",
      action: () => router.push("/"),
      keywords: ["home", "overview"],
    },
    {
      id: "activity",
      label: "Go to Activity Feed",
      icon: "◎",
      action: () => router.push("/activity"),
      keywords: ["history", "log", "actions"],
    },
    {
      id: "calendar",
      label: "Go to Calendar",
      icon: "◫",
      action: () => router.push("/calendar"),
      keywords: ["cron", "schedule", "jobs"],
    },
    {
      id: "search",
      label: "Go to Search",
      icon: "⌕",
      action: () => router.push("/search"),
      keywords: ["find", "query"],
    },
    {
      id: "reindex",
      label: "Reindex Search",
      icon: "↻",
      action: async () => {
        await fetch("/api/index", { method: "POST" });
        router.push("/search");
      },
      keywords: ["refresh", "update"],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.includes(q))
    );
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd+K to toggle
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      if (!open) return;

      // Navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          i === 0 ? filteredCommands.length - 1 : i - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          cmd.action();
          setOpen(false);
          setQuery("");
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    },
    [open, filteredCommands, selectedIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-md">
        <div className="border-b border-zinc-200 p-3">
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-lg"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                  i === selectedIndex
                    ? "bg-zinc-100"
                    : "hover:bg-zinc-50"
                )}
              >
                <span className="text-muted-foreground">{cmd.icon}</span>
                <span className="text-zinc-900">{cmd.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-zinc-200 px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
