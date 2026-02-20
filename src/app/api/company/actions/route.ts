import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const INDEX_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');

interface ActionIndexItem {
  id: string;
  assignee?: string;
  task: string;
  status: string;
  source: string;
  priority?: string;
  created?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get('agent');
    const statusFilter = searchParams.get('status');

    if (!existsSync(INDEX_PATH)) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const data = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    let items: ActionIndexItem[] = data.items || [];

    // Get briefs that reference action items
    const briefsWithActions = await db.brief.findMany({
      where: { metadata: { not: null } },
      select: { id: true, status: true, title: true, metadata: true },
    });

    const queueMap: Record<string, { id: string; status: string; title: string }> = {};
    for (const b of briefsWithActions) {
      if (b.metadata) {
        try {
          const meta = JSON.parse(b.metadata);
          if (meta.actionItemId) {
            queueMap[meta.actionItemId] = { id: b.id, status: b.status, title: b.title };
          }
        } catch { /* ignore parse errors */ }
      }
    }

    if (agentFilter) items = items.filter(i => i.assignee === agentFilter);
    if (statusFilter) items = items.filter(i => i.status === statusFilter);

    const augmented = items.map(item => ({
      ...item,
      pipelineStatus: queueMap[item.id]?.status ?? null,
      pipelineBriefId: queueMap[item.id]?.id ?? null,
      pipelineBriefTitle: queueMap[item.id]?.title ?? null,
    }));

    return NextResponse.json({ items: augmented, total: augmented.length });
  } catch (error) {
    return NextResponse.json({ items: [], total: 0, error: String(error) });
  }
}
