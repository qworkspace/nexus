import { ActiveBuilds } from "@/components/builds/ActiveBuilds";
import { RecentBuilds } from "@/components/builds/RecentBuilds";
import { BuildQueue } from "@/components/builds/BuildQueue";
import { BuildStats } from "@/components/builds/BuildStats";
import { FailedBuilds } from "@/components/builds/FailedBuilds";
import {
  mockActiveBuilds,
  mockRecentBuilds,
  mockBuildQueue,
  mockBuildStats,
  mockFailedBuilds,
} from "@/lib/build-mock";

export default function BuildsPage() {
  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Build Monitor</h1>
        <p className="text-zinc-500 text-sm">
          Dev agent build tracking and management
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Active builds and stats */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveBuilds builds={mockActiveBuilds} />
          <RecentBuilds builds={mockRecentBuilds} />
        </div>

        {/* Right column - Stats and queue */}
        <div className="space-y-6">
          <BuildStats stats={mockBuildStats} />
          <BuildQueue queue={mockBuildQueue} />
        </div>
      </div>

      {/* Failed builds - full width if any */}
      {mockFailedBuilds.length > 0 && (
        <div className="mt-6">
          <FailedBuilds builds={mockFailedBuilds} />
        </div>
      )}
    </div>
  );
}
