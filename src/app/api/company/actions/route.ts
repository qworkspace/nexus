import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const INDEX_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');
const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');

interface ActionIndexItem {
  id: string;
  assignee?: string;
  task: string;
  status: string;
  source: string;
  priority?: string;
  created?: string;
}

interface PipelineQueueEntry {
  id: string;
  actionItemId?: string;
  status: string;
  title: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get('agent');
    const statusFilter = searchParams.get('status');

    const data = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    let items: ActionIndexItem[] = data.items || [];

    // Load pipeline queue for status overlay
    const queueMap: Record<string, PipelineQueueEntry> = {};
    if (existsSync(QUEUE_PATH)) {
      const queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
      for (const entry of (queueData.briefs || []) as PipelineQueueEntry[]) {
        if (entry.actionItemId) {
          queueMap[entry.actionItemId] = entry;
        }
      }
    }

    if (agentFilter) {
      items = items.filter(i => i.assignee === agentFilter);
    }
    if (statusFilter) {
      items = items.filter(i => i.status === statusFilter);
    }

    // Augment with pipeline status
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
