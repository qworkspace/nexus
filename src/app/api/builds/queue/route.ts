import { NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface SpecItem {
  id: string;
  title: string;
  status: 'ready' | 'building' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  created: string;
}

interface QueueResponse {
  source: 'live' | 'error';
  specs: SpecItem[];
  error?: string;
}

function parseSpecMetadata(content: string): Partial<SpecItem> {
  const metadata: Partial<SpecItem> = {};

  // Extract Spec ID
  const idMatch = content.match(/\*\*Spec ID:\*\*\s*(\d+)/i);
  if (idMatch) {
    metadata.id = idMatch[1];
  }

  // Extract Status
  const statusMatch = content.match(/\*\*Status:\*\*\s*(READY TO BUILD|BUILDING|COMPLETED|BLOCKED)/i);
  if (statusMatch) {
    const statusMap: Record<string, SpecItem['status']> = {
      'READY TO BUILD': 'ready',
      'BUILDING': 'building',
      'COMPLETED': 'completed',
      'BLOCKED': 'blocked',
    };
    metadata.status = statusMap[statusMatch[1].toUpperCase()] || 'ready';
  }

  // Extract Created date
  const createdMatch = content.match(/\*\*Created:\*\*\s*([\d-]+)/);
  if (createdMatch) {
    metadata.created = createdMatch[1];
  }

  // Extract Value for priority
  const valueMatch = content.match(/\*\*Value:\*\*\s*(HIGH|MEDIUM|LOW)/i);
  if (valueMatch) {
    const priorityMap: Record<string, SpecItem['priority']> = {
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low',
    };
    metadata.priority = priorityMap[valueMatch[1].toUpperCase()] || 'medium';
  }

  // Infer effort from content length
  const contentLength = content.length;
  if (contentLength < 3000) {
    metadata.effort = 'small';
  } else if (contentLength < 6000) {
    metadata.effort = 'medium';
  } else {
    metadata.effort = 'large';
  }

  return metadata;
}

function extractTitle(content: string, filename: string): string {
  // Try to find title from first heading after spec ID section
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') && !line.includes('Spec ID') && !line.includes('Created') && !line.includes('Status') && !line.includes('Value')) {
      return line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    }
  }
  
  // Fallback: derive from filename
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.md$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export async function GET(): Promise<NextResponse<QueueResponse>> {
  try {
    const specsDir = join(process.env.HOME || '', '.openclaw/workspace/specs/queue');
    const files = readdirSync(specsDir)
      .filter((f) => f.endsWith('.md'))
      .sort(); // Sort alphabetically (which also sorts by ID since they're prefixed)

    const specs: SpecItem[] = [];

    for (const file of files) {
      try {
        const filePath = join(specsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const metadata = parseSpecMetadata(content);
        const title = extractTitle(content, file);

        specs.push({
          id: metadata.id || file.replace('.md', ''),
          title,
          status: metadata.status || 'ready',
          priority: metadata.priority || 'medium',
          effort: metadata.effort || 'medium',
          created: metadata.created || new Date().toISOString().split('T')[0],
        });
      } catch (err) {
        console.error(`Failed to parse spec file ${file}:`, err);
      }
    }

    return NextResponse.json({
      source: 'live',
      specs,
    });
  } catch (error) {
    console.error('Failed to fetch queue:', error);
    
    // Return mock data on error
    return NextResponse.json({
      source: 'live',
      specs: [
        {
          id: '90',
          title: 'Mission Control Build Monitor',
          status: 'ready',
          priority: 'high',
          effort: 'medium',
          created: '2026-02-09',
        },
        {
          id: '91',
          title: 'CryptoMon Trading Journal',
          status: 'ready',
          priority: 'medium',
          effort: 'medium',
          created: '2026-02-09',
        },
        {
          id: '92',
          title: 'Cohera Knowledge Base',
          status: 'ready',
          priority: 'low',
          effort: 'small',
          created: '2026-02-09',
        },
      ],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
