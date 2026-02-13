import { ActiveBuilds } from '@/components/builds/ActiveBuilds';
import { PipelineView } from '@/components/builds/PipelineView';
import { CompletedBuilds } from '@/components/builds/CompletedBuilds';
import { BuildStats } from '@/components/builds/BuildStats';
import { BuildSpeedMetrics } from '@/components/builds/BuildSpeedMetrics';
import { RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BuildsPage() {
  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Builds</h1>
            <p className="text-zinc-500 text-sm mt-1">Q Build Dashboard — Real-time</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
            <span>Live updates</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6">
        <BuildStats />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Builds */}
        <div className="lg:col-span-2">
          <ActiveBuilds />
        </div>

        {/* Pipeline View */}
        <PipelineView />

        {/* Completed Builds */}
        <div>
          <CompletedBuilds />
        </div>

        {/* Build Speed Metrics */}
        <BuildSpeedMetrics />
      </div>
    </div>
  );
}
