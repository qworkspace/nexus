import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';

const BUILDS_LOG = path.join(homedir(), '.openclaw', 'shared', 'overnight-builds.log');

export interface BuildEntry {
  id: string;
  spec: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'STALLED' | 'OTHER';
  timestamp: string;
  testStatus?: string;
  testDetails?: string;
}

export interface BuildSummary {
  successRate: number;
  totalBuilds: number;
  successCount: number;
  failedCount: number;
  otherCount: number;
}

interface ParsedLogEntry {
  id: string;
  spec: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'STALLED' | 'OTHER';
  timestamp: string;
  testStatus?: string;
  testDetails?: string;
}

function parseLogEntry(line: string): ParsedLogEntry | null {
  // Pattern: [YYYY-MM-DD HH:MM] CI: <spec> — BUILD: <status> — TEST: <result> (<details>)
  const standardMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]?\s*CI:\s*(.+?)\s+—\s*BUILD:\s*(\w+)(?:\s*—\s*TEST:\s*(\w+)(?:\s*\(([^)]*)\))?)?/);

  if (standardMatch) {
    const [, timestamp, spec, buildStatus, testStatus, testDetails] = standardMatch;
    let status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'STALLED' | 'OTHER' = 'OTHER';

    switch (buildStatus) {
      case 'SUCCESS':
        status = 'SUCCESS';
        break;
      case 'FAILED':
        status = 'FAILED';
        break;
      case 'SKIPPED':
        status = 'SKIPPED';
        break;
      case 'STALLED':
        status = 'STALLED';
        break;
      default:
        status = 'OTHER';
    }

    return {
      id: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spec: spec.trim(),
      status,
      timestamp,
      testStatus,
      testDetails,
    };
  }

  return null;
}

async function getBuildEntries(limit = 20): Promise<ParsedLogEntry[]> {
  try {
    const content = await fs.readFile(BUILDS_LOG, 'utf-8');
    const lines = content.trim().split('\n').reverse(); // Most recent first

    const entries: ParsedLogEntry[] = [];
    for (const line of lines) {
      if (entries.length >= limit) break;

      const entry = parseLogEntry(line);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  } catch (error) {
    console.error('Failed to read builds log:', error);
    return [];
  }
}

function calculateBuildSummary(entries: ParsedLogEntry[]): BuildSummary {
  const relevantEntries = entries.filter(e => e.status === 'SUCCESS' || e.status === 'FAILED');
  const totalBuilds = relevantEntries.length;
  const successCount = entries.filter(e => e.status === 'SUCCESS').length;
  const failedCount = entries.filter(e => e.status === 'FAILED').length;
  const otherCount = entries.length - successCount - failedCount;

  return {
    successRate: totalBuilds > 0 ? Math.round((successCount / totalBuilds) * 100) : 100,
    totalBuilds,
    successCount,
    failedCount,
    otherCount,
  };
}

export async function GET() {
  try {
    const entries = await getBuildEntries(50); // Get more entries for summary calculation
    const summary = calculateBuildSummary(entries);

    // Return last 20 entries
    const recentBuilds: BuildEntry[] = entries.slice(0, 20).map(entry => ({
      id: entry.id,
      spec: entry.spec,
      status: entry.status,
      timestamp: entry.timestamp,
      testStatus: entry.testStatus,
      testDetails: entry.testDetails,
    }));

    return NextResponse.json({
      builds: recentBuilds,
      summary,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch builds', details: err.message },
      { status: 500 }
    );
  }
}
