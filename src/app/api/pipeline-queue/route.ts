import { NextResponse } from 'next/server';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');
const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');

export interface PipelineQueueItem {
  id: string;
  title: string;
  description: string;
  source: 'retro' | 'manual';
  sourceRef: string | null;
  status: 'queued' | 'speccing' | 'building' | 'qa' | 'shipped' | 'rejected' | 'deferred';
  priority: 'HIGH' | 'MED' | 'LOW';
  complexity: 'HIGH' | 'MED' | 'LOW';
  createdAt: string;
  approvedAt: string;
  assignee: string;
  actionItemId?: string;
  specPath?: string;
}

export async function GET() {
  try {
    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ briefs: [], updated: null, actionItems: [] });
    }

    const raw = readFileSync(QUEUE_PATH, 'utf-8');
    const data = JSON.parse(raw);

    // Load action items filtered to PJ-assignee + todo status
    let actionItems: object[] = [];
    try {
      if (existsSync(ACTION_ITEMS_PATH)) {
        const aiRaw = readFileSync(ACTION_ITEMS_PATH, 'utf-8');
        const aiData = JSON.parse(aiRaw);
        actionItems = (aiData.items || []).filter(
          (item: { status: string; assignee: string }) =>
            item.status === 'todo' && item.assignee === 'PJ'
        );
      }
    } catch { /* non-fatal — actionItems stays empty */ }

    return NextResponse.json({
      briefs: (data.briefs || []) as PipelineQueueItem[],
      updated: data.updated || null,
      actionItems,
    });
  } catch (error) {
    console.error('Failed to read pipeline-queue.json:', error);
    return NextResponse.json(
      { briefs: [], updated: null, actionItems: [], error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending-review', 'queued', 'speccing', 'building', 'qa', 'shipped', 'rejected', 'deferred', 'parked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const raw = existsSync(QUEUE_PATH) ? readFileSync(QUEUE_PATH, 'utf-8') : '{"briefs":[]}';
    const data = JSON.parse(raw);

    if (!data.briefs) data.briefs = [];
    const idx = data.briefs.findIndex((b: PipelineQueueItem) => b.id === id);
    if (idx === -1) {
      // If title is present, treat as a new brief creation
      if (body.title) {
        data.briefs.push(body);
        data.updated = new Date().toISOString();
        writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        return NextResponse.json({ ok: true, created: true, brief: body });
      }
      return NextResponse.json({ error: `Brief ${id} not found` }, { status: 404 });
    }

    data.briefs[idx].status = status;
    data.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, brief: data.briefs[idx] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
