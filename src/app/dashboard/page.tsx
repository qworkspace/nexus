"use client";

import { LiveAgentStatusPanel } from "./components/LiveAgentStatusPanel";
import { ModelIntelligenceDashboard } from "./components/ModelIntelligenceDashboard";
import { BusinessHealthCards } from "./components/BusinessHealthCards";
import { CronJobMonitor } from "./components/CronJobMonitor";
import { CronDashboard } from "./components/CronDashboard";
import { NotificationCenter } from "./components/NotificationCenter";
import { SessionInsights } from "./components/SessionInsights";
import { QuickActionsBar } from "./components/QuickActionsBar";
import { MemoryPanel } from "./components/MemoryPanel";
import { MemoryDashboard } from "./components/MemoryDashboard";
import { BuildMonitor } from "./components/BuildMonitor";
import { CostTracker } from "./components/CostTracker";
import { CostBreakdown } from "./components/CostBreakdown";
import { CostTrend } from "./components/CostTrend";
import { HealthMonitor } from "./components/HealthMonitor";
import { BackupMonitor } from "./components/BackupMonitor";
import { LessonsSummary } from "@/components/dashboard/components/LessonsSummary";
import { BugTrackerPanel } from "./components/BugTrackerPanel";

export default function MissionControlDashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              MISSION CONTROL
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Q&apos;s Command Center
            </p>
          </div>
          <NotificationCenter />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar />

      {/* Main Content */}
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Row 1: Health Monitor & Backup Monitor */}
          <HealthMonitor />
          <BackupMonitor />

          {/* Row 2: Agent Status & Model Intelligence */}
          <div className="col-span-12 lg:col-span-5">
            <LiveAgentStatusPanel />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ModelIntelligenceDashboard />
          </div>
          <div className="col-span-12 lg:col-span-3">
            <BusinessHealthCards />
          </div>

          {/* Row 2: Memory Dashboard, Cron Jobs, Session Insights */}
          <div className="col-span-12">
            <MemoryDashboard />
          </div>

          {/* Row 3: Memory Panel, Cron Jobs, Lessons Summary */}
          <div className="col-span-12 lg:col-span-4">
            <MemoryPanel />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <CronJobMonitor />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <LessonsSummary />
          </div>

          {/* Row 4: Session Insights */}
          <div className="col-span-12 lg:col-span-4">
            <SessionInsights />
          </div>

          {/* Row 4: Comprehensive Cron Dashboard */}
          <div className="col-span-12">
            <CronDashboard />
          </div>

          {/* Row 5: Build Monitor */}
          <div className="col-span-12">
            <BuildMonitor />
          </div>

          {/* Row 6: Cost Tracking */}
          <div className="col-span-12 lg:col-span-3">
            <CostTracker />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <CostTrend />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <CostBreakdown />
          </div>

          {/* Row 7: Bug Tracker */}
          <div className="col-span-12">
            <BugTrackerPanel />
          </div>
        </div>

        {/* Footer Session Stats */}
        <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Real-time updates enabled</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>Auto-refresh: 10-30s</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 font-mono">?</kbd> for shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
