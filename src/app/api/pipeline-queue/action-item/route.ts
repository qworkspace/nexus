import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const ACTION_ITEMS_PATH = join(HOME, '.openclaw', 'shared', 'action-items', 'index.json');
const QUEUE_PATH = join(HOME, '.openclaw', 'shared', 'pipeline-queue.json');
const SPEC_BRIEFS_DIR = join(HOME, '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_DIR = join(HOME, '.openclaw', 'shared', 'archive', 'rejected-actions');
const ACTIVITY_FEED_PATH = join(HOME, '.openclaw', 'shared', 'activity-feed.json');

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
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }
    if (!['approve', 'reject', 'defer'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve, reject, or defer' }, { status: 400 });
    }

    if (!existsSync(ACTION_ITEMS_PATH)) {
      return NextResponse.json({ error: 'action-items/index.json not found' }, { status: 404 });
    }

    const raw = readFileSync(ACTION_ITEMS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const items: ActionItem[] = data.items || [];
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: `Action item ${id} not found` }, { status: 404 });
    }

    const item = items[idx];
    const today = new Date().toISOString().slice(0, 10);

    if (action === 'approve') {
      // 1. Update status in action-items/index.json
      data.items[idx].status = 'approved';
      data.updated = new Date().toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      // 2. Write spec-brief file
      if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
      const slug = id.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 60);
      const briefFilename = `${today}-${slug}.md`;
      const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);
      const briefContent = `# ${item.task}

**Status:** queued
**Priority:** ${item.priority || 'MED'}
**Created:** ${today}
**Slug:** ${slug}
**Source:** ${item.source}
**Approved:** ${today} (PJ via Nexus Brief Queue — Action Item)
**ActionItemId:** ${item.id}

## Brief

${item.task}

## Assignee Chain

Cipher (spec) → Spark (build) → Flux (QA)
`;
      if (!existsSync(briefPath)) {
        writeFileSync(briefPath, briefContent, 'utf-8');
      }

      // 3. Add to pipeline-queue.json
      let queueData: { briefs: object[]; updated?: string } = { briefs: [] };
      if (existsSync(QUEUE_PATH)) {
        queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
        if (!Array.isArray(queueData.briefs)) queueData.briefs = [];
      }
      const newBriefId = `brief-${today}-${slug}`;
      const alreadyQueued = queueData.briefs.some((b: object & { id?: string }) => b.id === newBriefId);
      if (!alreadyQueued) {
        queueData.briefs.push({
          id: newBriefId,
          title: item.task,
          description: item.task,
          source: 'retro',
          sourceRef: `action-items/${item.id}`,
          status: 'queued',
          priority: (item.priority || 'MED').toUpperCase(),
          complexity: 'MED',
          createdAt: item.created || new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          assignee: 'research (Cipher)',
          actionItemId: item.id,
        });
        queueData.updated = new Date().toISOString();
        writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');
      }

      // 4. Write activity-feed entry for Q to spawn Cipher
      let feedData: { entries: object[] } = { entries: [] };
      if (existsSync(ACTIVITY_FEED_PATH)) {
        try {
          feedData = JSON.parse(readFileSync(ACTIVITY_FEED_PATH, 'utf-8'));
          if (!Array.isArray(feedData.entries)) feedData.entries = [];
        } catch { feedData = { entries: [] }; }
      }
      feedData.entries.unshift({
        id: `nexus-action-approve-${id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'brief_approved',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '✅',
        message: `PJ approved action item from Nexus: "${item.task}". Cipher spawn needed.`,
        briefId: newBriefId,
        briefPath,
        actionItemId: id,
      });
      writeFileSync(ACTIVITY_FEED_PATH, JSON.stringify(feedData, null, 2), 'utf-8');

      return NextResponse.json({ ok: true, id, action: 'approve', briefId: newBriefId });

    } else if (action === 'reject') {
      data.items[idx].status = 'rejected';
      data.items[idx].rejectedAt = new Date().toISOString();
      data.updated = new Date().toISOString();
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      // Archive the rejected item
      if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });
      const archivePath = join(ARCHIVE_DIR, `${today}-${id}.json`);
      writeFileSync(
        archivePath,
        JSON.stringify({
          id,
          task: item.task,
          rejectedAt: new Date().toISOString(),
          source: item.source,
        }, null, 2),
        'utf-8'
      );

      return NextResponse.json({ ok: true, id, action: 'reject', archived: archivePath });

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
