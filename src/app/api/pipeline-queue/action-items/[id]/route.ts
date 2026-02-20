import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');
const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_ACTIONS_DIR = join(homedir(), '.openclaw', 'shared', 'archive', 'rejected-actions');

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  status: string;
  source: string;
  priority: string;
  created: string;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['approve', 'reject', 'defer'].includes(action)) {
      return NextResponse.json({ error: 'action must be one of: approve, reject, defer' }, { status: 400 });
    }
    if (!existsSync(ACTION_ITEMS_PATH)) {
      return NextResponse.json({ error: 'action-items/index.json not found' }, { status: 404 });
    }

    const data = JSON.parse(readFileSync(ACTION_ITEMS_PATH, 'utf-8'));
    const items: ActionItem[] = data.items || [];
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return NextResponse.json({ error: `Action item ${id} not found` }, { status: 404 });

    const item = items[idx];
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (action === 'approve') {
      items[idx].status = 'approved';
      data.updated = now.toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      const slug = slugify(item.task);
      const briefFilename = `${today}-${slug}.md`;
      const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);
      if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });

      const priorityMap: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' };
      const priority = priorityMap[item.priority] || 'MED';

      if (!existsSync(briefPath)) {
        writeFileSync(briefPath, `# ${item.task}\n\n**Status:** queued\n**Priority:** ${priority}\n**Created:** ${today}\n**Source:** retro (${item.source})\n**ActionItemId:** ${item.id}\n\n## Brief\n\n${item.task}\n\n## Assignee Chain\n\nCipher (spec) → Spark (build) → Flux (QA)\n`, 'utf-8');
      }

      const newBriefId = `brief-${today}-${slug.slice(0, 32)}`;
      const exists = await db.brief.findUnique({ where: { id: newBriefId } });
      if (!exists) {
        await db.brief.create({
          data: {
            id: newBriefId,
            title: item.task,
            description: item.task,
            source: 'retro',
            sourceRef: item.source || null,
            status: 'queued',
            priority,
            complexity: 'MED',
            createdAt: item.created ? new Date(item.created) : now,
            approvedAt: now,
            assignee: 'research (Cipher)',
            metadata: JSON.stringify({ actionItemId: item.id }),
          },
        });
      }

      await db.pipelineActivity.create({
        data: {
          type: 'brief_approved',
          agent: 'nexus',
          agentName: 'Nexus',
          emoji: '✅',
          message: `PJ approved action item: "${item.task}". Cipher spawn needed.`,
          briefId: newBriefId,
          metadata: JSON.stringify({ briefPath, actionItemId: id }),
        },
      });

      return NextResponse.json({ ok: true, id, newStatus: 'approved', briefPath });
    }

    if (action === 'reject') {
      items[idx].status = 'rejected';
      data.updated = now.toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      if (!existsSync(ARCHIVE_ACTIONS_DIR)) mkdirSync(ARCHIVE_ACTIONS_DIR, { recursive: true });
      writeFileSync(join(ARCHIVE_ACTIONS_DIR, `${today}-${id}.json`), JSON.stringify({ ...item, status: 'rejected', rejectedAt: now.toISOString() }, null, 2), 'utf-8');

      await db.pipelineActivity.create({
        data: {
          type: 'action_rejected',
          agent: 'nexus',
          agentName: 'Nexus',
          emoji: '❌',
          message: `PJ rejected action item: "${item.task}".`,
          metadata: JSON.stringify({ actionItemId: id }),
        },
      });

      return NextResponse.json({ ok: true, id, newStatus: 'rejected' });
    }

    if (action === 'defer') {
      items[idx].status = 'deferred';
      data.updated = now.toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      await db.pipelineActivity.create({
        data: {
          type: 'action_deferred',
          agent: 'nexus',
          agentName: 'Nexus',
          emoji: '⏸',
          message: `PJ deferred action item: "${item.task}".`,
          metadata: JSON.stringify({ actionItemId: id }),
        },
      });

      return NextResponse.json({ ok: true, id, newStatus: 'deferred' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('action-item action error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
