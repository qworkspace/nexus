import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';

// ============================================================================
// Types
// ============================================================================

interface CheckpointFile {
  filename: string;
  agentType: string;
  sessionKey: string;
  timestamp: string;
  error: string;
  status: string;
  fullPath: string;
  dateDir: string;
  content?: string;
}

interface CheckpointData {
  checkpoints: CheckpointFile[];
  dates: string[];
  totalCount: number;
  groupByDate: Record<string, CheckpointFile[]>;
}

// ============================================================================
// Parse checkpoint file
// ============================================================================

function parseCheckpoint(content: string, filename: string, dateDir: string): CheckpointFile | null {
  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const agentType = frontmatter.match(/agent_type:\s*(.+)/)?.[1]?.trim() || 'unknown';
  const sessionKey = frontmatter.match(/session_key:\s*(.+)/)?.[1]?.trim() || 'unknown';
  const timestamp = frontmatter.match(/timestamp:\s*(.+)/)?.[1]?.trim() || '';
  const error = frontmatter.match(/error:\s*(.+)/)?.[1]?.trim() || '';
  const status = frontmatter.match(/status:\s*(.+)/)?.[1]?.trim() || 'unknown';

  return {
    filename,
    agentType,
    sessionKey,
    timestamp,
    error,
    status,
    fullPath: path.join(homedir(), 'shared', 'checkpoints', dateDir, filename),
    dateDir,
    content,
  };
}

// ============================================================================
// Get all checkpoints
// ============================================================================

async function getAllCheckpoints(): Promise<CheckpointFile[]> {
  const CHECKPOINT_BASE_DIR = path.join(homedir(), 'shared', 'checkpoints');

  try {
    const dates = await fs.readdir(CHECKPOINT_BASE_DIR);
    const allCheckpoints: CheckpointFile[] = [];

    for (const dateDir of dates) {
      const datePath = path.join(CHECKPOINT_BASE_DIR, dateDir);
      const stat = await fs.stat(datePath);
      if (!stat.isDirectory()) continue;

      try {
        const files = await fs.readdir(datePath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(datePath, file);
          const content = await fs.readFile(filePath, 'utf-8');

          const checkpoint = parseCheckpoint(content, file, dateDir);
          if (checkpoint) {
            allCheckpoints.push(checkpoint);
          }
        }
      } catch (error) {
        console.error(`Failed to read checkpoint directory ${dateDir}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    return allCheckpoints.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Failed to read checkpoints directory:', error);
    return [];
  }
}

// ============================================================================
// Group checkpoints by date
// ============================================================================

function groupByDate(checkpoints: CheckpointFile[]): Record<string, CheckpointFile[]> {
  const grouped: Record<string, CheckpointFile[]> = {};

  for (const checkpoint of checkpoints) {
    if (!grouped[checkpoint.dateDir]) {
      grouped[checkpoint.dateDir] = [];
    }
    grouped[checkpoint.dateDir].push(checkpoint);
  }

  return grouped;
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const checkpointId = searchParams.get('id');

    // Get checkpoint details by ID
    if (checkpointId) {
      const allCheckpoints = await getAllCheckpoints();
      const checkpoint = allCheckpoints.find(
        cp => cp.filename === checkpointId || cp.filename.includes(checkpointId)
      );

      if (!checkpoint) {
        return NextResponse.json(
          { error: 'Checkpoint not found' },
          { status: 404 }
        );
      }

      // Read full content
      const fullPath = path.join(homedir(), 'shared', 'checkpoints', checkpoint.dateDir, checkpoint.filename);
      const content = await fs.readFile(fullPath, 'utf-8');
      checkpoint.content = content;

      return NextResponse.json({ checkpoint });
    }

    // Get checkpoints for specific date or all dates
    const allCheckpoints = await getAllCheckpoints();

    let filteredCheckpoints = allCheckpoints;
    if (date) {
      filteredCheckpoints = allCheckpoints.filter(cp => cp.dateDir === date);
    }

    const dates = Array.from(new Set(allCheckpoints.map(cp => cp.dateDir)))
      .sort((a, b) => b.localeCompare(a));

    const data: CheckpointData = {
      checkpoints: filteredCheckpoints,
      dates,
      totalCount: allCheckpoints.length,
      groupByDate: groupByDate(allCheckpoints),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkpoints', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
