import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');
const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');
const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_ACTIONS_DIR = join(homedir(), '.openclaw', 'shared', 'archive', 'rejected-actions');
const ACTIVITY_FEED_PATH = join(homedir(), '.openclaw', 'shared', 'activity-feed.json');

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  status: string;
  source: string;
  priority: string;
  created: string;
}

interface PipelineQueueItem {
  id: string;
  title: string;
  description: string;
  source: 'retro' | 'manual';
  sourceRef: string | null;
  status: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  complexity: 'HIGH' | 'MED' | 'LOW';
  createdAt: string;
  approvedAt: string;
  assignee: string;
  actionItemId?: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function writeActivityFeed(entry: object) {
  let feedData: { entries: object[] } = { entries: [] };
  if (existsSync(ACTIVITY_FEED_PATH)) {
    const raw = readFileSync(ACTIVITY_FEED_PATH, 'utf-8');
    feedData = JSON.parse(raw);
    if (!Array.isArray(feedData.entries)) feedData.entries = [];
  }
  feedData.entries.unshift(entry);
  writeFileSync(ACTIVITY_FEED_PATH, JSON.stringify(feedData, null, 2), 'utf-8');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: 'approve' | 'reject' | 'defer' };

    if (!['approve', 'reject', 'defer'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: approve, reject, defer' },
        { status: 400 }
      );
    }

    // 1. Load action-items/index.json
    if (!existsSync(ACTION_ITEMS_PATH)) {
      return NextResponse.json({ error: 'action-items/index.json not found' }, { status: 404 });
    }
    const raw = readFileSync(ACTION_ITEMS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const items: ActionItem[] = data.items || [];

    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: `Action item ${id} not found` }, { status: 404 });
    }

    const item = items[idx];
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    // ── APPROVE ────────────────────────────────────────────────────
    if (action === 'approve') {
      // Update status in action-items
      items[idx].status = 'approved';
      data.updated = now;
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      // Write spec-brief file
      const slug = slugify(item.task);
      const briefFilename = `${today}-${slug}.md`;
      const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);

      if (!existsSync(SPEC_BRIEFS_DIR)) {
        mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
      }

      if (!existsSync(briefPath)) {
        const priorityMap: Record<string, string> = {
          high: 'HIGH', medium: 'MED', low: 'LOW',
        };
        const priority = priorityMap[item.priority] || 'MED';
        const briefContent = `# ${item.task}

**Status:** queued
**Priority:** ${priority}
**Created:** ${today}
**Slug:** ${slug}
**Source:** retro (${item.source})
**Approved:** ${today} (PJ via Nexus Brief Queue)
**ActionItemId:** ${item.id}

## Brief

${item.task}

## Assignee Chain

Cipher (spec) → Spark (build) → Flux (QA)
`;
        writeFileSync(briefPath, briefContent, 'utf-8');
      }

      // Append to pipeline-queue.json
      const priorityMap: Record<string, 'HIGH' | 'MED' | 'LOW'> = {
        high: 'HIGH', medium: 'MED', low: 'LOW',
      };
      const queuePriority: 'HIGH' | 'MED' | 'LOW' = priorityMap[item.priority] || 'MED';

      let queueData: { briefs: PipelineQueueItem[]; updated: string } = {
        briefs: [], updated: now
      };
      if (existsSync(QUEUE_PATH)) {
        queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
        if (!Array.isArray(queueData.briefs)) queueData.briefs = [];
      }

      // Only add if not already in queue
      const alreadyQueued = queueData.briefs.some(
        (b) => b.actionItemId === item.id
      );
      if (!alreadyQueued) {
        const newBriefId = `brief-${today}-${slugify(item.task).slice(0, 32)}`;
        queueData.briefs.push({
          id: newBriefId,
          title: item.task,
          description: item.task,
          source: 'retro',
          sourceRef: item.source || null,
          status: 'queued',
          priority: queuePriority,
          complexity: 'MED',
          createdAt: now,
          approvedAt: now,
          assignee: 'research (Cipher)',
          actionItemId: item.id,
        });
        queueData.updated = now;
        writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');
      }

      // Activity feed
      writeActivityFeed({
        id: `nexus-action-approve-${id}-${Date.now()}`,
        timestamp: now,
        type: 'brief_approved',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '✅',
        message: `PJ approved action item: "${item.task}". Cipher spawn needed.`,
        actionItemId: id,
        briefPath,
      });

      return NextResponse.json({
        ok: true,
        id,
        newStatus: 'approved',
        briefPath,
        note: 'Q will see the activity-feed entry and spawn Cipher.',
      });
    }

    // ── REJECT ─────────────────────────────────────────────────────
    if (action === 'reject') {
      items[idx].status = 'rejected';
      data.updated = now;
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      // Write a rejection record to archive
      if (!existsSync(ARCHIVE_ACTIONS_DIR)) {
        mkdirSync(ARCHIVE_ACTIONS_DIR, { recursive: true });
      }
      const archivePath = join(ARCHIVE_ACTIONS_DIR, `${today}-${id}.json`);
      writeFileSync(
        archivePath,
        JSON.stringify({ ...item, status: 'rejected', rejectedAt: now, rejectedBy: 'PJ (Nexus)' }, null, 2),
        'utf-8'
      );

      writeActivityFeed({
        id: `nexus-action-reject-${id}-${Date.now()}`,
        timestamp: now,
        type: 'action_rejected',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '❌',
        message: `PJ rejected action item: "${item.task}".`,
        actionItemId: id,
      });

      return NextResponse.json({ ok: true, id, newStatus: 'rejected', archivePath });
    }

    // ── DEFER ──────────────────────────────────────────────────────
    if (action === 'defer') {
      items[idx].status = 'deferred';
      data.updated = now;
      writeFileSync(ACTION_ITEMS_PATH, JSON.stringify(data, null, 2), 'utf-8');

      writeActivityFeed({
        id: `nexus-action-defer-${id}-${Date.now()}`,
        timestamp: now,
        type: 'action_deferred',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '⏸',
        message: `PJ deferred action item: "${item.task}".`,
        actionItemId: id,
      });

      return NextResponse.json({ ok: true, id, newStatus: 'deferred' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('action-item action error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
