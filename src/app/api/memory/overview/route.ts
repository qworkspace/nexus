import { NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

interface MemoryOverview {
  memoryMd: string;
  dailyFiles: MemoryFile[];
  stats: {
    totalFiles: number;
    totalSize: number;
    lastModified: string;
  };
}

async function getMemoryOverview(): Promise<MemoryOverview> {
  const memoryDir = `${process.env.HOME}/.openclaw/workspace/memory`;
  const memoryMdPath = `${process.env.HOME}/.openclaw/workspace/MEMORY.md`;

  try {
    // Read MEMORY.md
    const memoryMd = await readFile(memoryMdPath, 'utf-8');

    // Get daily memory files
    const files = await readdir(memoryDir);
    const dailyFiles: MemoryFile[] = [];

    let totalSize = 0;
    let lastModified = '';

    for (const file of files) {
      // Only process .md files (daily memories)
      if (file.endsWith('.md')) {
        const filePath = join(memoryDir, file);
        const fileStat = await stat(filePath);

        dailyFiles.push({
          name: file,
          path: filePath,
          size: fileStat.size,
          modified: fileStat.mtime.toISOString(),
        });

        totalSize += fileStat.size;

        if (fileStat.mtime > new Date(lastModified || 0)) {
          lastModified = fileStat.mtime.toISOString();
        }
      }
    }

    // Sort by modified date (newest first)
    dailyFiles.sort((a, b) =>
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    return {
      memoryMd,
      dailyFiles,
      stats: {
        totalFiles: dailyFiles.length,
        totalSize,
        lastModified,
      },
    };
  } catch (error) {
    console.error('Failed to get memory overview:', error);
    throw error;
  }
}

export async function GET(): Promise<NextResponse<MemoryOverview | { error: string }>> {
  try {
    const overview = await getMemoryOverview();
    return NextResponse.json(overview);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch memory overview' },
      { status: 500 }
    );
  }
}
