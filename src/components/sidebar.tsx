"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { KeyHint } from "@/components/KeyHint";
import {
  LayoutGrid, GitBranch, Calendar,
  Gauge, Hammer, Search, Menu, X, HeartPulse, Shield, Activity
} from "lucide-react";

const navigation = [
  { name: "The Core", href: "/company", icon: HeartPulse, shortcut: "mod+1" },
  { name: "The Floor", href: "/company/floor", icon: LayoutGrid, shortcut: null },
  { name: "Org Chart", href: "/company/org", icon: GitBranch, shortcut: null },
  { name: "Meetings", href: "/company/meetings", icon: Calendar, shortcut: null },
  { name: "divider", href: "", icon: null, shortcut: null },
  { name: "Command Center", href: "/command-center", icon: Gauge, shortcut: "mod+2" },
  { name: "Pipeline", href: "/hub-research", icon: Hammer, shortcut: "mod+3" },
  { name: "divider2", href: "", icon: null, shortcut: null },
  { name: "Usage", href: "/usage", icon: Activity, shortcut: "mod+5" },
  { name: "Governance", href: "/governance", icon: Shield, shortcut: null },
  { name: "Search", href: "/search", icon: Search, shortcut: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-border text-foreground rounded-lg shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen border-r border-border bg-white flex flex-col transition-all duration-200",
          collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0",
          "w-56"
        )}
      >
        {/* Header with logo mark */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold leading-none">N</span>
            </div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              Nexus
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {navigation.map((item) => {
            if (item.name.startsWith("divider")) {
              return <div key={item.name} className="my-2 border-t border-border" />;
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
                    ? "bg-foreground text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.icon && <item.icon size={16} className="shrink-0" />}
                <span className="flex-1">{item.name}</span>
                {item.shortcut && (
                  <KeyHint keys={item.shortcut} showOnHover className="opacity-0 group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Keyboard shortcut hints */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Quick actions</span>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground border border-border text-[10px]">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Shortcuts help</span>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground border border-border text-[10px]">
              ⌘/
            </kbd>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Built for PJ by Q</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/10 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
