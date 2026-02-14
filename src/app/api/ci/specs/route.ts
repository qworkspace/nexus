import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';

const SPECS_DIR = path.join(homedir(), 'shared', 'research', 'ai-intel', 'specs');

export interface SpecQueueItem {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

async function getSpecQueue(): Promise<SpecQueueItem[]> {
  try {
    const files = await fs.readdir(SPECS_DIR);
    const queueItems: SpecQueueItem[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const file of files) {
      // Skip processed, parked, and stuck files
      if (file.includes('.processed') || file.includes('.parked') || file.includes('.stuck')) {
        continue;
      }
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(SPECS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract metadata
      const priorityMatch = content.match(/\*\*Priority:\*\*\s*(\w+)/i);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const createdMatch = content.match(/\*\*Created:\*\*\s*(.+)/i);
      const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/i);

      // Determine status
      const status = statusMatch?.[1]?.toLowerCase();
      
      // Only include if:
      // 1. Status is explicitly 'queued', OR
      // 2. No status AND created within 7 days
      const createdAt = createdMatch?.[1]?.trim() 
        ? new Date(createdMatch[1].trim()) 
        : new Date(0);
      
      const isQueued = status === 'queued';
      const isRecent = !status && createdAt >= sevenDaysAgo;
      
      if (!isQueued && !isRecent) {
        continue; // Skip stale specs
      }

      // Determine priority
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (priorityMatch) {
        const p = priorityMatch[1].toUpperCase();
        if (p === 'HIGH' || p === 'MEDIUM' || p === 'LOW') {
          priority = p as 'HIGH' | 'MEDIUM' | 'LOW';
        }
      }

      queueItems.push({
        id: file.replace('.md', ''),
        title: titleMatch?.[1]?.trim() || file.replace('.md', ''),
        priority,
        createdAt: createdMatch?.[1]?.trim() || new Date().toISOString().split('T')[0],
      });
    }

    // Sort by priority then by date (HIGH first)
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    queueItems.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

    return queueItems;
  } catch (error) {
    console.error('Failed to read specs:', error);
    return [];
  }
}

export async function GET() {
  try {
    const queue = await getSpecQueue();
    return NextResponse.json(queue);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch specs', details: err.message },
      { status: 500 }
    );
  }
}
