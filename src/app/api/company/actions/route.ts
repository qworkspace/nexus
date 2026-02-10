import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const INDEX_PATH = join(process.env.HOME || '', 'shared/action-items/index.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get('agent');
    const statusFilter = searchParams.get('status');

    const data = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    let items = data.items || [];

    if (agentFilter) {
      items = items.filter((i: { assignee?: string }) => i.assignee === agentFilter);
    }
    if (statusFilter) {
      items = items.filter((i: { status?: string }) => i.status === statusFilter);
    }

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json({ items: [], total: 0, error: String(error) });
  }
}
