import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const INDEX_PATH = join(process.env.HOME || '', '.openclaw/shared/action-items/index.json');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));

    const item = (data.items || []).find((i: { id: string }) => i.id === id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (body.status) item.status = body.status;
    if (body.outcome) item.outcome = body.outcome;
    if (body.blockedBy) item.blockedBy = body.blockedBy;
    if (body.status === 'in-progress') item.startedAt = new Date().toISOString();
    if (body.status === 'done') item.completedAt = new Date().toISOString();

    data.updated = new Date().toISOString();
    writeFileSync(INDEX_PATH, JSON.stringify(data, null, 2));

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update', detail: String(error) },
      { status: 500 }
    );
  }
}
