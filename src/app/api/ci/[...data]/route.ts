import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';
import type { CIDashboardData, CIBuild, CIQueueItem, CIPipelineHealth } from '@/types/ci';

const SHARED_DIR = path.join(homedir(), 'shared');
const SPECS_DIR = path.join(SHARED_DIR, 'research', 'ai-intel', 'specs');
const BUILDS_LOG = path.join(SHARED_DIR, 'overnight-builds.log');

// ============================================================================
// Parse overnight-builds.log
// ============================================================================

interface ParsedLogEntry {
  id: string;
  spec: string;
  status: 'running' | 'success' | 'failed' | 'parked';
  timestamp: string;
  testStatus?: 'pass' | 'fail' | 'pending';
  testDetails?: string;
  agent?: string;
  raw: string;
  isParked?: boolean;
}

function parseLogEntry(line: string): ParsedLogEntry | null {
  // Pattern: [YYYY-MM-DD HH:MM] CI: <spec> — BUILD: <status> — TEST: <result> (<details>)
  const standardMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]?\s*CI:\s*(.+?)\s+—\s*BUILD:\s*(\w+)(?:\s*—\s*TEST:\s*(\w+)(?:\s*\(([^)]*)\))?)?/);
  const parkedMatch = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+CI:\s*(.+?)\s+—\s*PARKED\s*\(([^)]*)\)/);
  const sparkMatch = line.match(/^\[([^\]]+)\]\s+Spark:\s+(.+)$/);

  if (parkedMatch) {
    const [, timestamp, spec, reason] = parkedMatch;
    return {
      id: `parked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spec,
      status: 'parked',
      timestamp,
      testDetails: reason,
      raw: line,
    };
  }

  if (standardMatch) {
    const [, timestamp, spec, buildStatus, testStatus, testDetails] = standardMatch;
    const statusMap: Record<string, 'running' | 'success' | 'failed' | 'parked'> = {
      'RUNNING': 'running',
      'SUCCESS': 'success',
      'FAILED': 'failed',
      'PARKED': 'parked',
    };

    return {
      id: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spec,
      status: statusMap[buildStatus] || 'running',
      timestamp,
      testStatus: testStatus?.toLowerCase() as 'pass' | 'fail' | 'pending' | undefined,
      testDetails,
      raw: line,
    };
  }

  if (sparkMatch) {
    const [, , message] = sparkMatch;
    return {
      id: `spark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spec: message.substring(0, 50),
      status: 'success',
      timestamp: new Date().toISOString(),
      agent: 'Spark',
      testStatus: 'pass',
      raw: line,
    };
  }

  return null;
}

function extractProject(spec: string): string {
  // Try to extract project name from spec
  const projectPatterns: Record<string, RegExp[]> = {
    'Nexus': [/nexus/i, /dashboard/i, /panel/i, /mission-control/i],
    'CryptoMon': [/cryptomon/i, /crypto/i, /trading/i],
    'Tools': [/q-health/i, /q-context/i, /cli/i, /tool/i, /command/i],
    'Agents': [/agent/i, /mesh/i, /lifecycle/i],
    'Memory': [/memory/i, /episodic/i, /recall/i],
    'Resilience': [/resilience/i, /circuit/i, /breaker/i],
  };

  for (const [project, patterns] of Object.entries(projectPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(spec)) {
        return project;
      }
    }
  }

  return 'Other';
}

async function getLogEntries(limit = 50): Promise<ParsedLogEntry[]> {
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

// ============================================================================
// Parse spec files for queue
// ============================================================================

async function getSpecQueue(): Promise<CIQueueItem[]> {
  try {
    const files = await fs.readdir(SPECS_DIR);
    const queueItems: CIQueueItem[] = [];

    for (const file of files) {
      // Skip processed and parked files
      if (file.includes('.processed') || file.includes('.parked')) continue;
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(SPECS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract metadata
      const riskMatch = content.match(/\*\*Risk Level:\*\*\s*(\w+)/i);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const createdMatch = content.match(/\*\*Created:\*\*\s*(.+)/i);

      // Determine priority based on risk level
      const riskLevel = riskMatch?.[1]?.toUpperCase() || 'LOW';
      let priority: 'HIGH' | 'MED' | 'LOW' = 'LOW';
      if (riskLevel === 'HIGH') priority = 'HIGH';
      else if (riskLevel === 'MEDIUM') priority = 'MED';

      queueItems.push({
        id: file.replace('.md', ''),
        title: titleMatch?.[1]?.trim() || file,
        priority,
        riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        createdAt: createdMatch?.[1]?.trim() || new Date().toISOString().split('T')[0],
      });
    }

    // Sort by priority (HIGH first)
    const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
    queueItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return queueItems;
  } catch (error) {
    console.error('Failed to read specs:', error);
    return [];
  }
}

// ============================================================================
// Build health metrics
// ============================================================================

function calculateHealth(entries: ParsedLogEntry[]): CIPipelineHealth {
  const filtered = entries.filter(e => e.status === 'success' || e.status === 'failed');

  const totalBuilds = filtered.length;
  const successCount = filtered.filter(e => e.status === 'success').length;
  const failureCount = filtered.filter(e => e.status === 'failed').length;

  const failuresByProject: Record<string, number> = {};
  for (const entry of filtered) {
    if (entry.status === 'failed') {
      const project = extractProject(entry.spec);
      failuresByProject[project] = (failuresByProject[project] || 0) + 1;
    }
  }

  return {
    successRate: totalBuilds > 0 ? Math.round((successCount / totalBuilds) * 100) : 100,
    totalBuilds,
    successCount,
    failureCount,
    failuresByProject,
  };
}

// ============================================================================
// Convert parsed entries to CIBuild
// ============================================================================

function toCIBuild(entry: ParsedLogEntry): CIBuild {
  return {
    id: entry.id,
    spec: entry.spec,
    status: entry.status,
    timestamp: entry.timestamp,
    testStatus: entry.testStatus,
    testDetails: entry.testDetails,
    agent: entry.agent || 'dev',
    project: extractProject(entry.spec),
  };
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { data: string[] } }
) {
  const dataPath = params.data?.join('/') || '';

  try {
    // Get all data
    const [entries, queue] = await Promise.all([
      getLogEntries(50),
      getSpecQueue(),
    ]);

    const health = calculateHealth(entries);

    // Find active build (first running entry)
    const activeEntry = entries.find(e => e.status === 'running');
    const activeBuild = activeEntry ? toCIBuild(activeEntry) : null;

    // Convert recent entries
    const recentBuilds = entries
      .filter(e => e.status !== 'running')
      .slice(0, 10)
      .map(toCIBuild);

    // Handle different data paths
    if (dataPath === 'queue') {
      return NextResponse.json({ queue });
    }

    if (dataPath === 'active') {
      return NextResponse.json({ activeBuild });
    }

    if (dataPath === 'recent') {
      return NextResponse.json({ recentBuilds });
    }

    if (dataPath === 'health') {
      return NextResponse.json(health);
    }

    // Default: return all data
    const dashboardData: CIDashboardData = {
      queue,
      activeBuild,
      recentBuilds,
      health,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching CI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CI data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
