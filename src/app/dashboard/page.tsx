"use client";

import { LiveSessions } from "./components/LiveSessions";
import { AgentFleet } from "./components/AgentFleet";
import { CronHealth } from "./components/CronHealth";
import { CostTicker } from "./components/CostTicker";
import { QuickActions } from "./components/QuickActions";

export default function LiveDashboard() {
  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Mission Control</h1>
        <p className="text-zinc-500 text-sm">Live Operations Dashboard</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Session Monitor and Agent Fleet */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Live Session Monitor */}
          <LiveSessions />
          
          {/* Agent Fleet Status */}
          <AgentFleet />
        </div>

        {/* Middle Column - Cron Health and Cost Ticker */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Cron Health Panel */}
          <CronHealth />
          
          {/* Cost Ticker */}
          <CostTicker />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="col-span-12 lg:col-span-3">
          {/* Quick Actions Bar */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
