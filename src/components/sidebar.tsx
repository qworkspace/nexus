"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "◉" },
  { name: "Activity", href: "/activity", icon: "◎" },
  { name: "Calendar", href: "/calendar", icon: "◫" },
  { name: "Search", href: "/search", icon: "⌕" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-zinc-200 bg-zinc-50 flex flex-col">
      <div className="p-4 border-b border-zinc-200">
        <h1 className="text-lg font-semibold text-zinc-900">Mission Control</h1>
        <p className="text-xs text-zinc-500">Q&apos;s Activity Dashboard</p>
      </div>
      <nav className="flex-1 p-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
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
      <div className="p-4 border-t border-zinc-200 text-xs text-zinc-400">
        Built for PJ by Q
      </div>
    </aside>
  );
}
