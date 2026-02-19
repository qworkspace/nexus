import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');
const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ACTIVITY_FEED_PATH = join(homedir(), '.openclaw', 'shared', 'activity-feed.json');

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
  specPath?: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId } = body;

    if (!briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    }

    // 1. Load pipeline-queue.json
    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }
    const queueRaw = readFileSync(QUEUE_PATH, 'utf-8');
    const queueData = JSON.parse(queueRaw);

    const idx = (queueData.briefs || []).findIndex(
      (b: PipelineQueueItem) => b.id === briefId
    );
    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found in pipeline-queue.json` }, { status: 404 });
    }

    const item: PipelineQueueItem = queueData.briefs[idx];

    // 2. Update status based on current state
    // pending-review → queued (PJ approves brief)
    // queued → speccing (triggers Cipher)
    const currentStatus = item.status;
    if (currentStatus === 'pending-review') {
      queueData.briefs[idx].status = 'queued';
      queueData.briefs[idx].approvedAt = new Date().toISOString();
      queueData.updated = new Date().toISOString();
      writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');
      return NextResponse.json({
        ok: true,
        briefId: item.id,
        newStatus: 'queued',
        note: 'Brief approved and queued. Will be picked up for speccing.',
      });
    }

    queueData.briefs[idx].status = 'speccing';
    queueData.updated = new Date().toISOString();
    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    // 3. Write spec-brief trigger file (so Cipher can pick it up)
    const today = new Date().toISOString().slice(0, 10);
    const slug = slugify(item.title);
    const briefFilename = `${today}-${slug}.md`;
    const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);

    if (!existsSync(SPEC_BRIEFS_DIR)) {
      mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
    }

    // Only create if the file doesn't already exist
    if (!existsSync(briefPath)) {
      const briefContent = `# ${item.title}

**Status:** queued
**Priority:** ${item.priority}
**Created:** ${today}
**Slug:** ${slug}
**Source:** ${item.source}${item.sourceRef ? ` (${item.sourceRef})` : ''}
**Approved:** ${today} (PJ via Nexus Brief Queue)
**PipelineQueueId:** ${item.id}

## Brief

${item.description}

## Assignee Chain

Cipher (spec) → Spark (build) → Flux (QA)
`;
      writeFileSync(briefPath, briefContent, 'utf-8');
    }

    // 4. Write activity-feed.json entry so Q knows to spawn Cipher
    let feedData: { entries: object[] } = { entries: [] };
    if (existsSync(ACTIVITY_FEED_PATH)) {
      const feedRaw = readFileSync(ACTIVITY_FEED_PATH, 'utf-8');
      feedData = JSON.parse(feedRaw);
      if (!Array.isArray(feedData.entries)) feedData.entries = [];
    }

    feedData.entries.unshift({
      id: `nexus-approve-${briefId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'brief_approved',
      agent: 'nexus',
      agentName: 'Nexus',
      emoji: '✅',
      message: `PJ approved brief from Nexus: "${item.title}". Cipher spawn needed.`,
      briefId: item.id,
      briefPath,
    });
    writeFileSync(ACTIVITY_FEED_PATH, JSON.stringify(feedData, null, 2), 'utf-8');

    return NextResponse.json({
      ok: true,
      briefId: item.id,
      newStatus: 'speccing',
      briefPath,
      note: 'Q will see the activity-feed entry and spawn Cipher.',
    });

  } catch (error) {
    console.error('pipeline-queue approve error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
