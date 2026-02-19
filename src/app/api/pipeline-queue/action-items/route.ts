import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');

export interface PendingActionItem {
  id: string;
  task: string;
  assignee: string;
  status: string;
  source: string;
  priority: string;
  created: string;
}

export async function GET() {
  try {
    if (!existsSync(ACTION_ITEMS_PATH)) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const raw = readFileSync(ACTION_ITEMS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const allItems: PendingActionItem[] = data.items || [];

    // Filter: assignee = PJ, status = todo or pending
    const pendingPJ = allItems.filter(
      (item) =>
        item.assignee === 'PJ' &&
        ['todo', 'pending'].includes(item.status)
    );

    return NextResponse.json({
      items: pendingPJ,
      total: pendingPJ.length,
    });
  } catch (error) {
    console.error('action-items GET error:', error);
    return NextResponse.json({ items: [], total: 0, error: String(error) }, { status: 500 });
  }
}
