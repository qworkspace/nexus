import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const HOME = homedir();
const ACTION_ITEMS_PATH = join(HOME, '.openclaw', 'shared', 'action-items', 'index.json');
const SPEC_BRIEFS_DIR = join(HOME, '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_DIR = join(HOME, '.openclaw', 'shared', 'archive', 'rejected-actions');

interface ActionItem {
  id: string;
  assignee: string;
  task: string;
  status: string;
  source: string;
  priority: string;
  created: string;
}

export async function POST(request: Request) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    if (!['approve', 'reject', 'defer'].includes(action)) return NextResponse.json({ error: 'action must be approve, reject, or defer' }, { status: 400 });
    if (!existsSync(ACTION_ITEMS_PATH)) return NextResponse.json({ error: 'action-items/index.json not found' }, { status: 404 });

    const data = JSON.parse(readFileSync(ACTION_ITEMS_PATH, 'utf-8'));
    const items: ActionItem[] = data.items || [];
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return NextResponse.json({ error: `Action item ${id} not found` }, { status: 404 });

    const item = items[idx];
    const today = new Date().toISOString().slice(0, 10);

    if (action === 'approve') {
      data.items[idx].status = 'approved';
      data.updated = new Date().toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
      const slug = id.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 60);
      const briefFilename = `${today}-${slug}.md`;
      const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);
      if (!existsSync(briefPath)) {
        writeFileSync(briefPath, `# ${item.task}\n\n**Status:** queued\n**Priority:** ${item.priority || 'MED'}\n**Created:** ${today}\n**Source:** ${item.source}\n**ActionItemId:** ${item.id}\n\n## Brief\n\n${item.task}\n\n## Assignee Chain\n\nCipher (spec) → Spark (build) → Flux (QA)\n`, 'utf-8');
      }

      const newBriefId = `brief-${today}-${slug}`;
      const exists = await db.brief.findUnique({ where: { id: newBriefId } });
      if (!exists) {
        await db.brief.create({
          data: {
            id: newBriefId,
            title: item.task,
            description: item.task,
            source: 'retro',
            sourceRef: `action-items/${item.id}`,
            status: 'queued',
            priority: (item.priority || 'MED').toUpperCase(),
            complexity: 'MED',
            createdAt: item.created ? new Date(item.created) : new Date(),
            approvedAt: new Date(),
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

      return NextResponse.json({ ok: true, id, action: 'approve', briefId: newBriefId });

    } else if (action === 'reject') {
      data.items[idx].status = 'rejected';
      data.items[idx].rejectedAt = new Date().toISOString();
      data.updated = new Date().toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });
      writeFileSync(join(ARCHIVE_DIR, `${today}-${id}.json`), JSON.stringify({ id, task: item.task, rejectedAt: new Date().toISOString(), source: item.source }, null, 2), 'utf-8');

      return NextResponse.json({ ok: true, id, action: 'reject' });

    } else if (action === 'defer') {
      data.items[idx].status = 'deferred';
      data.updated = new Date().toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return NextResponse.json({ ok: true, id, action: 'defer' });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (error) {
    console.error('action-item route error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
