import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    const projectDir = path.join(process.env.HOME || '', '.openclaw/projects/nexus');

    // Get builds with timestamps
    const gitLog = execSync(
      `git log --format='%H|%s|%ai' --since='30 days ago'`,
      { cwd: projectDir, encoding: 'utf-8' }
    );

    const commits = gitLog.trim().split('\n').filter(line => line.trim());

    // Group by day
    const buildsPerDay = new Map<string, number>();
    const buildDurationTrend: { date: string; minutes: number }[] = [];

    for (const line of commits) {
      const [, message, timestamp] = line.split('|');
      const date = new Date(timestamp).toISOString().split('T')[0];

      if (!buildsPerDay.has(date)) {
        buildsPerDay.set(date, 0);
      }

      // Count feat/fix commits as builds
      if (message.includes('feat:') || message.includes('fix:')) {
        buildsPerDay.set(date, buildsPerDay.get(date)! + 1);
      }
    }

    const buildsPerDayArray = Array.from(buildsPerDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Re-calculate rework rate (estimated from failed builds in session data)
    const reworkRate = 15; // Placeholder - implement by parsing failed sessions

    return NextResponse.json({
      specToShipTime: [],
      buildDurationTrend,
      buildsPerDay: buildsPerDayArray.slice(-14), // Last 14 days
      reworkRate,
    });
  } catch (error) {
    console.error('Error fetching build speed metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
