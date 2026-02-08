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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Agents & Crons */}
          <div className="space-y-6">
            <AgentStatusPanel />
            <CronMonitorPanel />
          </div>

          {/* Middle Column - Memory & Models */}
          <div className="space-y-6">
            <MemoryContextPanel />
            <ModelIntelligencePanel />
          </div>

          {/* Right Column - Session Insights */}
          <div className="space-y-6">
            <SessionInsightsPanel />
            
            {/* Additional Status Card */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-500 mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Gateway</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-600 dark:text-green-400">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Database</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">API Rate</span>
                  <span className="text-zinc-600 dark:text-zinc-400">42 req/min</span>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-500 mb-3">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Refresh</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Spawn</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">A</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">New Spec</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">S</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Search</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">/</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Report</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">D</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Palette</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">⌘K</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
