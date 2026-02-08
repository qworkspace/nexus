import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface SourceFile {
  path: string;
  name: string;
  chunkCount: number;
  lastModified: string;
}

interface SourcesResponse {
  files: SourceFile[];
  totalFiles: number;
}

async function getSources(): Promise<SourcesResponse> {
  try {
    // First get stats to get the source files
    const { stdout, stderr } = await execAsync(
      'python3 ~/.openclaw/workspace/tools/memory-api/q-memory stats'
    );

    if (stderr && !stdout) {
      console.error('q-memory stats error:', stderr);
      return { files: [], totalFiles: 0 };
    }

    const lines = stdout.split('\n');
    const sources: SourceFile[] = [];
    let inSourcesSection = false;

    for (const line of lines) {
      // Check if we're in the Sources section
      if (line === 'Sources:') {
        inSourcesSection = true;
        continue;
      }

      // If we hit another section, stop
      if (inSourcesSection && line.trim() && !line.match(/^\s+\S/)) {
        break;
      }

      // Match source files: "  /Users/.../AGENTS.md: 27"
      const sourceMatch = line.match(/^\s+(.+):\s+(\d+)$/);
      if (sourceMatch) {
        const fullPath = sourceMatch[1];
        const chunkCount = parseInt(sourceMatch[2]);

        // Get file name from path
        const name = path.basename(fullPath);

        // Get last modified date
        let lastModified = 'Unknown';
        try {
          const stat = await fs.stat(fullPath);
          lastModified = stat.mtime.toISOString();
        } catch {
          // File might not exist or be inaccessible
        }

        sources.push({
          path: fullPath,
          name,
          chunkCount,
          lastModified,
        });
      }
    }

    // Sort by name
    sources.sort((a, b) => a.name.localeCompare(b.name));

    return { files: sources, totalFiles: sources.length };
  } catch (error) {
    console.error('Failed to get sources:', error);
    return { files: [], totalFiles: 0 };
  }
}

export async function GET(): Promise<NextResponse<SourcesResponse>> {
  const result = await getSources();
  return NextResponse.json(result);
}
