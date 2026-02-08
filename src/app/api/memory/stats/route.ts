import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface MemoryEntry {
  date: string;
  title: string;
  preview: string;
  size: number;
}

interface MemoryStats {
  source: 'live' | 'mock' | 'error';
  currentContext: {
    used: number;
    max: number;
    percentage: number;
  };
  recentEntries: MemoryEntry[];
  topicCloud: { topic: string; count: number }[];
  totalFiles: number;
  totalSize: number;
  error?: string;
}

const WORKSPACE_PATH = process.env.HOME + '/.openclaw/workspace';
const MEMORY_PATH = path.join(WORKSPACE_PATH, 'memory');

async function getMemoryStats(): Promise<MemoryStats> {
  try {
    // Check if memory directory exists
    let files: string[] = [];
    try {
      files = await fs.readdir(MEMORY_PATH);
    } catch {
      // Memory directory doesn't exist yet
      return getMockStats();
    }

    const mdFiles = files.filter(f => f.endsWith('.md'));
    let totalSize = 0;
    const entries: MemoryEntry[] = [];
    const topicCounts: Record<string, number> = {};

    // Process each memory file
    for (const file of mdFiles.slice(-10)) { // Last 10 files
      const filePath = path.join(MEMORY_PATH, file);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      const title = lines[0]?.replace(/^#+\s*/, '') || file;
      const preview = lines.slice(1, 3).join(' ').slice(0, 100);

      entries.push({
        date: file.replace('.md', ''),
        title,
        preview,
        size: stat.size,
      });

      // Extract topics (words starting with # or common patterns)
      const topics = content.match(/#[\w-]+|(?:project|task|build|fix|feature|bug|meeting):\s*\w+/gi) || [];
      topics.forEach(topic => {
        const normalized = topic.toLowerCase().replace(/^#/, '');
        topicCounts[normalized] = (topicCounts[normalized] || 0) + 1;
      });
    }

    // Sort entries by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));

    // Convert topic counts to array
    const topicCloud = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Estimate context usage (mock for now, would need OpenClaw integration)
    const contextUsed = Math.min(totalSize * 4, 150000); // ~4 tokens per byte estimate
    const contextMax = 200000;

    return {
      source: 'live',
      currentContext: {
        used: contextUsed,
        max: contextMax,
        percentage: Math.round((contextUsed / contextMax) * 100),
      },
      recentEntries: entries.slice(0, 5),
      topicCloud,
      totalFiles: mdFiles.length,
      totalSize,
    };
  } catch (error) {
    console.error('Failed to get memory stats:', error);
    return getMockStats();
  }
}

function getMockStats(): MemoryStats {
  return {
    source: 'mock',
    currentContext: {
      used: 45230,
      max: 200000,
      percentage: 23,
    },
    recentEntries: [
      {
        date: '2026-02-08',
        title: 'Mission Control v2 Build',
        preview: 'Started building the command center dashboard...',
        size: 2048,
      },
      {
        date: '2026-02-07',
        title: 'CryptoMon Progress',
        preview: 'Completed wallet integration and price display...',
        size: 1536,
      },
      {
        date: '2026-02-06',
        title: 'DJ Discovery Updates',
        preview: 'Added new artists to monitoring list...',
        size: 1024,
      },
    ],
    topicCloud: [
      { topic: 'cryptomon', count: 15 },
      { topic: 'mission-control', count: 12 },
      { topic: 'dj-discovery', count: 8 },
      { topic: 'youtube-monitor', count: 6 },
      { topic: 'telegram', count: 5 },
      { topic: 'cron-jobs', count: 4 },
    ],
    totalFiles: 45,
    totalSize: 92160,
  };
}

export async function GET(): Promise<NextResponse<MemoryStats>> {
  const stats = await getMemoryStats();
  return NextResponse.json(stats);
}
