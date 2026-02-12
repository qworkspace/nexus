import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { formatBytes } from '@/lib/data-utils';

const execAsync = promisify(exec);

interface FileSystemStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  lastModified: string | null;
  dailyFiles: { date: string; size: number; path: string }[];
}

interface MemoryStats {
  source: 'live' | 'mock' | 'error';
  totalMemories: number;
  model: string;
  lastUpdated: string;
  indexPath: string;
  sources: Record<string, number>;
  totalFiles: number;
  fileSystem?: FileSystemStats;
  error?: string;
}

async function getMemoryStats(): Promise<MemoryStats> {
  try {
    const { stdout, stderr } = await execAsync(
      'python3 ~/.openclaw/workspace/tools/memory-api/q-memory stats'
    );

    if (stderr && !stdout) {
      console.error('q-memory stats error:', stderr);
      return getMockStats();
    }

    // Parse the output
    const lines = stdout.split('\n');
    const stats: Partial<MemoryStats> = {
      source: 'live',
      sources: {},
    };

    for (const line of lines) {
      // Match: "Total memories: 33"
      const totalMatch = line.match(/^Total memories:\s+(\d+)$/);
      if (totalMatch) {
        stats.totalMemories = parseInt(totalMatch[1]);
        continue;
      }

      // Match: "Model: nomic-embed-text"
      const modelMatch = line.match(/^Model:\s+(.+)$/);
      if (modelMatch) {
        stats.model = modelMatch[1];
        continue;
      }

      // Match: "Last updated: 2026-02-08T01:59:14.145536"
      const updatedMatch = line.match(/^Last updated:\s+(.+)$/);
      if (updatedMatch) {
        stats.lastUpdated = updatedMatch[1];
        continue;
      }

      // Match: "Index path: /Users/..."
      const pathMatch = line.match(/^Index path:\s+(.+)$/);
      if (pathMatch) {
        stats.indexPath = pathMatch[1];
        continue;
      }

      // Match source files: "  /Users/.../AGENTS.md: 27"
      const sourceMatch = line.match(/^\s+(.+):\s+(\d+)$/);
      if (sourceMatch) {
        const sourcePath = sourceMatch[1];
        const count = parseInt(sourceMatch[2]);
        stats.sources![sourcePath] = count;
        continue;
      }
    }

    stats.totalFiles = Object.keys(stats.sources!).length;

    return stats as MemoryStats;
  } catch (error) {
    console.error('Failed to get memory stats:', error);
    return getMockStats();
  }
}

function getMockStats(): MemoryStats {
  return {
    source: 'mock',
    totalMemories: 33,
    model: 'nomic-embed-text',
    lastUpdated: '2026-02-08T01:59:14.145536',
    indexPath: '~/.openclaw/workspace/tools/memory-api/index.json',
    sources: {
      '/Users/paulvillanueva/.openclaw/workspace/AGENTS.md': 27,
      '/Users/paulvillanueva/.openclaw/workspace/tools/memory-api/service.py': 4,
      '/Users/paulvillanueva/.openclaw/workspace/tools/memory-api/models.py': 1,
      '/Users/paulvillanueva/.openclaw/workspace/tools/memory-api/__init__.py': 1,
    },
    totalFiles: 4,
  };
}

async function getMemoryFileStats(): Promise<FileSystemStats | null> {
  const memoryDir = path.join(homedir(), '.openclaw', 'workspace', 'memory');

  try {
    const files = await readdir(memoryDir);
    let totalSize = 0;
    let fileCount = 0;
    let lastModified: Date | null = null;

    const dailyFiles: { date: string; size: number; path: string }[] = [];

    for (const file of files) {
      const filePath = path.join(memoryDir, file);
      const stats = await stat(filePath);

      if (stats.isFile()) {
        fileCount++;
        totalSize += stats.size;

        if (!lastModified || stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }

        // Track daily memory files
        if (file.match(/\d{4}-\d{2}-\d{2}\.md/)) {
          dailyFiles.push({
            date: file.replace('.md', ''),
            size: stats.size,
            path: filePath,
          });
        }
      }
    }

    return {
      totalFiles: fileCount,
      totalSizeBytes: totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      lastModified: lastModified?.toISOString() || null,
      dailyFiles: dailyFiles.sort((a, b) => b.date.localeCompare(a.date)),
    };
  } catch (error) {
    console.error('Failed to get memory file stats:', error);
    return null;
  }
}

export async function GET(): Promise<NextResponse<MemoryStats>> {
  const stats = await getMemoryStats();

  // Add filesystem stats
  const fileSystemStats = await getMemoryFileStats();
  if (fileSystemStats) {
    stats.fileSystem = fileSystemStats;
  }

  return NextResponse.json(stats);
}
