"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Command Center", href: "/command-center", icon: "🎛️" },
  { name: "Dashboard", href: "/", icon: "◉" },
  { name: "Analytics", href: "/analytics", icon: "📊" },
  { name: "Builds", href: "/builds", icon: "🔨" },
  { name: "Agents", href: "/agents", icon: "🦾" },
  { name: "Cron Jobs", href: "/crons", icon: "⏰" },
  { name: "Costs", href: "/costs", icon: "◈" },
  { name: "Evolution", href: "/evolution", icon: "📈" },
  { name: "Memory", href: "/memory", icon: "🧠" },
  { name: "Search", href: "/search", icon: "⌕" },
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
        {collapsed ? "☰" : "✕"}
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
            Mission Control
          </h1>
          <p className="text-xs text-zinc-500">Q&apos;s Activity Dashboard</p>
        </div>

        <nav className="flex-1 p-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setCollapsed(true)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Keyboard shortcut hint */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Quick actions</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-zinc-600">
              ⌘K
            </kbd>
          </div>
          <p className="text-xs text-zinc-400">Built for PJ by Q</p>
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
