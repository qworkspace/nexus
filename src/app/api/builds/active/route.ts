import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ActiveBuild {
  id: string;
  label: string;
  task: string;
  startedAt: string;
  runtime: number;
  tokens: number;
  model: string;
  status: 'building' | 'processing' | 'error';
}

interface ActiveBuildsResponse {
  source: 'live' | 'mock' | 'error';
  builds: ActiveBuild[];
  error?: string;
}

// Helper: Try to extract task from active spec file
function getTaskFromSpec(specId: string): string {
  try {
    const specPath = join(process.env.HOME || '', '.openclaw/workspace/specs/queue', `${specId}.md`);
    const content = readFileSync(specPath, 'utf-8');
    const goalMatch = content.match(/## Goal\s*\n([\s\S]*?)(?=##|$)/i);
    if (goalMatch) {
      const goal = goalMatch[1].trim();
      // Get first line as brief task
      const firstLine = goal.split('\n')[0].replace(/[*_#]/g, '').trim();
      return firstLine.substring(0, 100);
    }
  } catch {
    // Spec file might not exist or be inaccessible
  }
  return 'Building spec...';
}

export async function GET(): Promise<NextResponse<ActiveBuildsResponse>> {
  try {
    // Try to get active sessions from OpenClaw
    let sessionsResult: string;
    try {
      sessionsResult = execSync('openclaw sessions list --json 2>/dev/null || echo "[]"', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      sessionsResult = '[]';
    }

    let builds: ActiveBuild[] = [];
    try {
      const parsed = JSON.parse(sessionsResult);
      if (parsed?.sessions && Array.isArray(parsed.sessions)) {
        // Filter for active spawn agent sessions
        const now = Date.now();
        builds = parsed.sessions
          .filter((s: Record<string, unknown>) => {
            // Only include spawn agent sessions that have been active recently (within last 30 minutes)
            const key = String(s.key || '');
            const isSpawnAgent = key.startsWith('agent:spawn:') || key.startsWith('agent:dev:');
            const ageMs = typeof s.ageMs === 'number' ? s.ageMs : 0;
            const isActive = ageMs < 1800000; // Active if updated within 30 minutes
            return isSpawnAgent && isActive;
          })
          .map((s: Record<string, unknown>) => {
            const key = String(s.key || '');
            const parts = key.split(':');
            const specId = parts[parts.length - 1] || 'unknown';
            const label = String(s.label || specId).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return {
              id: String(s.sessionId || s.key || ''),
              label,
              task: getTaskFromSpec(specId),
              startedAt: new Date(now - (typeof s.ageMs === 'number' ? s.ageMs : 0)).toISOString(),
              runtime: Math.floor((typeof s.ageMs === 'number' ? s.ageMs : 0) / 1000),
              tokens: typeof s.totalTokens === 'number' ? s.totalTokens : 0,
              model: String(s.model || 'unknown'),
              status: (typeof s.abortedLastRun === 'boolean' && s.abortedLastRun) ? 'error' : 'building',
            };
          });
      }
    } catch {
      // Return mock data if parsing fails or no active builds
      builds = [
        {
          id: 'mock-001',
          label: 'Content CLI',
          task: 'Build CLI tool for video processing with Whisper and FFmpeg',
          startedAt: new Date(Date.now() - 600000).toISOString(),
          runtime: 600,
          tokens: 12450,
          model: 'glm-4.7',
          status: 'building',
        },
        {
          id: 'mock-002',
          label: 'Distribution Adapters',
          task: 'Implement platform adapters for content distribution',
          startedAt: new Date(Date.now() - 1200000).toISOString(),
          runtime: 1200,
          tokens: 28700,
          model: 'claude-sonnet-4',
          status: 'processing',
        },
      ];
    }

    return NextResponse.json({
      source: builds.length > 0 ? 'live' : 'mock',
      builds,
    });
  } catch (error) {
    console.error('Failed to fetch active builds:', error);
    return NextResponse.json({
      source: 'error',
      builds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
