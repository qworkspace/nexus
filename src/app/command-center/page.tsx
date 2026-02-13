"use client";

import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import {
  AgentStatusPanel,
  MemoryContextPanel,
  ModelIntelligencePanel,
  CronMonitorPanel,
  SessionInsightsPanel,
  QuickActionsBar,
} from "@/components/command-center";
import { useCommandStore } from "@/stores/commandStore";

export default function CommandCenterPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { openSpawn, openPalette } = useCommandStore();

  // Refresh all data
  const handleRefresh = useCallback(() => {
    mutate(() => true, undefined, { revalidate: true });
  }, [mutate]);

  // Keyboard shortcuts for this page
  useHotkeys('r', (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleRefresh();
    }
  });

  useHotkeys('a', (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      openSpawn();
    }
  });

  useHotkeys('s', (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      router.push('/specs/new');
    }
  });

  useHotkeys('/', (e) => {
    e.preventDefault();
    openPalette();
  });

  useHotkeys('d', (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      router.push('/analytics');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Command Center
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Q&apos;s mission control dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {new Date().toLocaleDateString('en-AU', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
            <span className="text-xs text-green-600 dark:text-green-400">Live</span>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActionsBar onRefresh={handleRefresh} />

        {/* Main Grid - 2 Row Layout */}
        <div className="space-y-4">
          {/* Top Row: 3 Columns - Live Agents | Crons | Session Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="max-h-[340px] overflow-hidden">
              <AgentStatusPanel />
            </div>
            <div className="max-h-[340px] overflow-hidden">
              <CronMonitorPanel />
            </div>
            <div className="max-h-[340px] overflow-hidden">
              <SessionInsightsPanel />
            </div>
          </div>

          {/* Bottom Row: 2 Columns - Memory | Model Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="max-h-[340px] overflow-hidden">
              <MemoryContextPanel />
            </div>
            <div className="max-h-[340px] overflow-hidden">
              <ModelIntelligencePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
