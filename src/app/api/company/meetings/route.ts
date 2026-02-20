import { NextResponse } from 'next/server';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const dynamic = 'force-dynamic';

const RETROS_DIR = join(homedir(), '.openclaw', 'shared', 'retros');
const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');

// --- Types ---

interface MeetingItem {
  id: string;
  filename: string;
  date: string;
  type: string;
  title: string;
  size: number;
  modified: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  status: 'pending' | 'approved' | 'done' | 'rejected' | 'deferred';
  source: string;
  pipelineStatus: 'queued' | 'building' | 'shipped' | null;
}

// --- Helpers ---

/**
 * Parse action items from a retro markdown file.
 * Looks for ## Actions for PJ and ## Actions Taken sections.
 */
function parseActionItemsFromMarkdown(
  content: string,
  retroId: string
): { task: string; status: 'pending' | 'done'; assignee: string; source: string }[] {
  const items: { task: string; status: 'pending' | 'done'; assignee: string; source: string }[] = [];

  // Match "## Actions for PJ" section
  const pjSectionMatch = content.match(/##\s+Actions for PJ\s*\n([\s\S]*?)(?=\n##|\n---|$)/);
  if (pjSectionMatch) {
    const lines = pjSectionMatch[1].split('\n');
    for (const line of lines) {
      const checkedMatch = line.match(/^\s*-\s+\[x\]\s+(.+)/i);
      const uncheckedMatch = line.match(/^\s*-\s+\[ \]\s+(.+)/);
      if (checkedMatch) {
        items.push({ task: checkedMatch[1].trim(), status: 'done', assignee: 'PJ', source: retroId });
      } else if (uncheckedMatch) {
        items.push({ task: uncheckedMatch[1].trim(), status: 'pending', assignee: 'PJ', source: retroId });
      }
    }
  }

  // Match "## Actions Taken" section
  const takenSectionMatch = content.match(/##\s+Actions Taken\s*\n([\s\S]*?)(?=\n##|\n---|$)/);
  if (takenSectionMatch) {
    const lines = takenSectionMatch[1].split('\n');
    for (const line of lines) {
      const checkedMatch = line.match(/^\s*-\s+\[x\]\s+(.+)/i);
      const uncheckedMatch = line.match(/^\s*-\s+\[ \]\s+(.+)/);
      if (checkedMatch) {
        items.push({ task: checkedMatch[1].trim(), status: 'done', assignee: 'Team', source: retroId });
      } else if (uncheckedMatch) {
        items.push({ task: uncheckedMatch[1].trim(), status: 'pending', assignee: 'Team', source: retroId });
      }
    }
  }

  return items;
}

/**
 * Slugify a task string to create a stable ID.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
}

// --- Route Handler ---

export async function GET() {
  try {
    // 1. List retro files
    const files = readdirSync(RETROS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();

    const meetings: MeetingItem[] = files.map(f => {
      const stats = statSync(join(RETROS_DIR, f));
      const name = f.replace('.md', '');
      const parts = name.split('-');
      const date = parts.slice(0, 3).join('-');
      const type = parts.slice(3).join('-') || 'retro';

      const typeLabels: Record<string, string> = {
        'retro': 'Team Retro',
        'standup': 'Morning Standup',
        'sync': 'Team Sync',
      };

      return {
        id: name,
        filename: f,
        date,
        type,
        title: typeLabels[type] || type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        size: stats.size,
        modified: stats.mtime.toISOString(),
      };
    });

    // 2. Load action-items/index.json for status overrides
    let indexedItems: {
      id: string;
      assignee?: string;
      task: string;
      status: string;
      source: string;
      priority?: string;
    }[] = [];
    if (existsSync(ACTION_ITEMS_PATH)) {
      const raw = readFileSync(ACTION_ITEMS_PATH, 'utf-8');
      const data = JSON.parse(raw);
      indexedItems = data.items || [];
    }

    // 3. Parse action items from most recent 3 retros
    const actionItems: ActionItem[] = [];
    const retrosToScan = files.slice(0, 3);

    for (const f of retrosToScan) {
      const retroId = f.replace('.md', '');
      const content = readFileSync(join(RETROS_DIR, f), 'utf-8');
      const parsed = parseActionItemsFromMarkdown(content, retroId);

      for (const p of parsed) {
        const slug = slugify(p.task);
        const derivedId = `${retroId}-${slug}`;

        const indexed = indexedItems.find(
          i => i.source === retroId && (i.id === derivedId || i.task.toLowerCase().includes(slug.slice(0, 20)))
        );

        const finalStatus = indexed
          ? (indexed.status as ActionItem['status'])
          : (p.status === 'done' ? 'done' : 'pending');

        let pipelineStatus: ActionItem['pipelineStatus'] = null;
        if (indexed?.status === 'approved') pipelineStatus = 'queued';

        actionItems.push({
          id: indexed?.id || derivedId,
          task: p.task,
          assignee: indexed?.assignee || p.assignee,
          status: finalStatus,
          source: retroId,
          pipelineStatus,
        });
      }
    }

    return NextResponse.json({ meetings, actionItems });
  } catch (error) {
    return NextResponse.json({ meetings: [], actionItems: [], error: String(error) });
  }
}
