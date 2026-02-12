import { NextResponse } from 'next/server';
import { getRecentBuilds } from '@/lib/data-utils';

interface RecentBuild {
  id: string;
  label: string;
  completedAt: string;
  lines: number;
  duration: number;
  status: 'success' | 'error' | 'cancelled';
  model?: string;
  commitHash?: string;
  commitUrl?: string;
}

interface RecentBuildsResponse {
  source: 'live' | 'mock' | 'error';
  builds: RecentBuild[];
  error?: string;
}

export async function GET(): Promise<NextResponse<RecentBuildsResponse>> {
  try {
    // Get real builds from dev agent session transcripts
    const rawBuilds = await getRecentBuilds('dev', 10);

    const builds: RecentBuild[] = rawBuilds.map((build) => ({
      id: build.id as string,
      label: build.label as string,
      completedAt: build.completedAt as string,
      lines: build.linesChanged as number,
      duration: build.duration as number,
      status: build.status as 'success' | 'error' | 'cancelled',
      model: build.model as string,
      commitHash: build.commitHash as string | undefined,
      commitUrl: build.commitUrl as string | undefined,
    }));

    if (builds.length > 0) {
      return NextResponse.json({
        source: 'live',
        builds,
      });
    }

    // Fall back to mock data if no real builds found
    return NextResponse.json({
      source: 'mock',
      builds: getMockBuilds(),
    });
  } catch (error) {
    console.error('Failed to fetch recent builds:', error);
    return NextResponse.json({
      source: 'error',
      builds: getMockBuilds(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getMockBuilds(): RecentBuild[] {
  return [
    {
      id: 'comp-001',
      label: 'IHV Events Automation',
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      lines: 1245,
      duration: 856,
      status: 'success',
      model: 'glm-4.7',
    },
    {
      id: 'comp-002',
      label: 'Nexus Dashboard',
      completedAt: new Date(Date.now() - 3600000).toISOString(),
      lines: 2340,
      duration: 1243,
      status: 'success',
      model: 'claude-opus-4-5',
    },
    {
      id: 'comp-003',
      label: 'CryptoMon Price Alerts',
      completedAt: new Date(Date.now() - 7200000).toISOString(),
      lines: 877,
      duration: 623,
      status: 'success',
      model: 'claude-sonnet-4',
    },
    {
      id: 'comp-004',
      label: 'OpenClaw Gateway Fix',
      completedAt: new Date(Date.now() - 10800000).toISOString(),
      lines: 432,
      duration: 312,
      status: 'error',
      model: 'glm-4.7',
    },
    {
      id: 'comp-005',
      label: 'Memory Panel',
      completedAt: new Date(Date.now() - 14400000).toISOString(),
      lines: 1567,
      duration: 945,
      status: 'success',
      model: 'claude-opus-4-5',
    },
  ];
}
