"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { KeyHint } from "@/components/KeyHint";
import {
  LayoutGrid, GitBranch, Calendar, Link as LinkIcon,
  Inbox, Gauge, Hammer, RefreshCw, MessageSquare, Brain, DollarSign,
  ScrollText, Clock, Search, Menu, X, Scale, Save, HeartPulse, Database
} from "lucide-react";

const navigation = [
  { name: "The Core", href: "/company", icon: HeartPulse, shortcut: "mod+1" },
  { name: "The Floor", href: "/company/floor", icon: LayoutGrid, shortcut: null },
  { name: "Org Chart", href: "/company/org", icon: GitBranch, shortcut: null },
  { name: "Meetings", href: "/company/meetings", icon: Calendar, shortcut: null },
  { name: "Relationships", href: "/company/relationships", icon: LinkIcon, shortcut: null },
  { name: "Action Items", href: "/company/actions", icon: Inbox, shortcut: null },
  { name: "divider", href: "", icon: null, shortcut: null },
  { name: "Command Center", href: "/command-center", icon: Gauge, shortcut: "mod+2" },
  { name: "Builds", href: "/builds", icon: Hammer, shortcut: "mod+3" },
  { name: "CI Pipeline", href: "/ci-pipeline", icon: RefreshCw, shortcut: null },
  { name: "Checkpoints", href: "/checkpoints", icon: Save, shortcut: null },
  { name: "Sessions", href: "/sessions", icon: MessageSquare, shortcut: null },
  { name: "Crons", href: "/crons", icon: Clock, shortcut: "mod+4" },
  { name: "divider2", href: "", icon: null, shortcut: null },
  { name: "Memory", href: "/memory", icon: Brain, shortcut: null },
  { name: "Decisions", href: "/decisions", icon: Scale, shortcut: null },
  { name: "Costs", href: "/costs", icon: DollarSign, shortcut: "mod+5" },
  { name: "Caching", href: "/caching", icon: Database, shortcut: null },
  { name: "Logs", href: "/logs", icon: ScrollText, shortcut: null },
  { name: "Search", href: "/search", icon: Search, shortcut: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 text-white rounded-lg"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen border-r border-zinc-200 bg-zinc-50 flex flex-col transition-all duration-200",
          collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0",
          "w-56"
        )}
      >
        <div className="p-4 border-b border-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">
            Nexus
          </h1>
          <p className="text-xs text-zinc-500">Q&apos;s Activity Dashboard</p>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {navigation.map((item) => {
            if (item.name.startsWith("divider")) {
              return <div key={item.name} className="my-2 border-t border-zinc-200" />;
            }
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setCollapsed(true)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                {item.icon && <item.icon size={18} className="shrink-0" />}
                <span className="flex-1">{item.name}</span>
                {item.shortcut && (
                  <KeyHint keys={item.shortcut} showOnHover className="opacity-0 group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Keyboard shortcut hint */}
        <div className="p-4 border-t border-zinc-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Quick actions</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-zinc-600">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Shortcuts help</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-zinc-600">
              ⌘/
            </kbd>
          </div>
          <p className="text-xs text-zinc-400 mt-2">Built for PJ by Q</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
