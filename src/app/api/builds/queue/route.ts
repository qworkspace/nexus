import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { QueuedSpec } from '@/types/builds';

const QUEUE_DIR = path.join(process.env.HOME || '', '.openclaw/workspace/specs/queue');

function parsePriority(content: string): 'P0' | 'P1' | 'P2' {
  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(P[0-2])/i);
  if (priorityMatch) {
    return priorityMatch[1] as 'P0' | 'P1' | 'P2';
  }
  return 'P2'; // Default to P2
}

function parseTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  // Use first line as fallback
  return content.split('\n')[0].trim().substring(0, 100);
}

function parseSpecId(content: string): string {
  const idMatch = content.match(/\*\*Spec ID:\*\*\s*(\d+)/i);
  return idMatch ? idMatch[1] : 'unknown';
}

function parseEpic(content: string): string | undefined {
  const epicMatch = content.match(/\*\*Epic:\s*\*\*(.+?)\*\*/i);
  if (epicMatch) {
    return epicMatch[1].trim();
  }
  // Fallback: match text after "Epic:" until end of line, excluding trailing asterisks
  const fallbackMatch = content.match(/\*\*Epic:\s*(.+?)(?:\n|$)/i);
  if (fallbackMatch) {
    return fallbackMatch[1].replace(/\*\*/g, '').trim();
  }
  return undefined;
}

function parseEstTime(content: string): string | undefined {
  const timeMatch = content.match(/\*\*Est\.\s*Time:\s*\*\*(.+?)\*\*/i);
  if (timeMatch) {
    return timeMatch[1].trim();
  }
  // Fallback: match text after "Est. Time:" until end of line, excluding trailing asterisks
  const fallbackMatch = content.match(/\*\*Est\.\s*Time:\s*(.+?)(?:\n|$)/i);
  if (fallbackMatch) {
    return fallbackMatch[1].replace(/\*\*/g, '').trim();
  }
  return undefined;
}

async function parseSpecFile(filePath: string): Promise<QueuedSpec | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    const title = parseTitle(content);
    const priority = parsePriority(content);
    const epic = parseEpic(content);
    const estTime = parseEstTime(content);
    const specId = parseSpecId(content);

    // Extract numeric ID from filename for sorting
    const filename = path.basename(filePath, '.md');

    return {
      id: `${specId}-${filename}`,
      title,
      priority,
      epic,
      estTime,
      createdAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    console.error(`Error parsing spec file ${filePath}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const files = await fs.readdir(QUEUE_DIR);
    const specFiles = files.filter(f => f.endsWith('.md'));

    const specs: QueuedSpec[] = [];

    for (const file of specFiles) {
      const spec = await parseSpecFile(path.join(QUEUE_DIR, file));
      if (spec) {
        specs.push(spec);
      }
    }

    // Sort by priority (P0 first), then by creation date
    const priorityOrder = { P0: 0, P1: 1, P2: 2 };
    specs.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json(specs);
  } catch (error) {
    console.error('Error fetching build queue:', error);
    return NextResponse.json({ error: 'Failed to fetch build queue' }, { status: 500 });
  }
}
