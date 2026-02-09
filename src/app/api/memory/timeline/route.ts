import { NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

interface TimelineEvent {
  date: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags?: string[];
}

interface MemoryTimeline {
  events: TimelineEvent[];
  stats: {
    totalEvents: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

async function getMemoryTimeline(): Promise<MemoryTimeline> {
  const memoryDir = `${process.env.HOME}/.openclaw/workspace/memory`;

  try {
    const files = await readdir(memoryDir);
    const events: TimelineEvent[] = [];

    // Only process .md files (daily memories)
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = join(memoryDir, file);
      const content = await readFile(filePath, 'utf-8');

      // Extract title and key points from markdown
      const lines = content.split('\n');
      let title = file.replace('.md', '');
      const summary = '';
      const keyPoints: string[] = [];
      const tags: string[] = [];

      let currentSection = '';

      for (const line of lines) {
        // Main title
        const titleMatch = line.match(/^#\s+(.+)$/);
        if (titleMatch) {
          title = titleMatch[1].replace(/2026-\d{2}-\d{2} —?\s*/, '').trim();
          continue;
        }

        // Section headers
        const sectionMatch = line.match(/^##\s+(.+)$/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].toLowerCase();
          continue;
        }

        // Bullet points in any section
        const bulletMatch = line.match(/^-\s+\*\*(.+?)\*\*:\s*(.+)$/);
        if (bulletMatch) {
          keyPoints.push(`${bulletMatch[1]}: ${bulletMatch[2]}`);
          continue;
        }

        // Simple bullet points
        const simpleBulletMatch = line.match(/^-\s+(.+)$/);
        if (simpleBulletMatch && currentSection) {
          keyPoints.push(simpleBulletMatch[1]);
          continue;
        }

        // Tags (look for #tag patterns)
        const tagMatches = Array.from(line.matchAll(/#(\w+)/g));
        for (const match of tagMatches) {
          if (!tags.includes(match[1])) {
            tags.push(match[1]);
          }
        }
      }

      // Get file stats for date
      const fileStat = await stat(filePath);

      events.push({
        date: fileStat.mtime.toISOString(),
        title: title || file.replace('.md', ''),
        summary: summary || `${keyPoints.slice(0, 2).join(' · ')}`,
        keyPoints: keyPoints.slice(0, 5), // Limit to 5 key points
        tags: tags.slice(0, 5), // Limit to 5 tags
      });
    }

    // Sort by date (newest first)
    events.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate date range
    const dates = events.map(e => new Date(e.date).getTime());
    const start = new Date(Math.min(...dates)).toISOString();
    const end = new Date(Math.max(...dates)).toISOString();

    return {
      events,
      stats: {
        totalEvents: events.length,
        dateRange: { start, end },
      },
    };
  } catch (error) {
    console.error('Failed to get memory timeline:', error);
    throw error;
  }
}

export async function GET(): Promise<NextResponse<MemoryTimeline | { error: string }>> {
  try {
    const timeline = await getMemoryTimeline();
    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch memory timeline' },
      { status: 500 }
    );
  }
}
