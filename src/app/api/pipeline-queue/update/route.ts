import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');

interface PipelineItemPatch {
  title?: string;
  problem?: string;
  solution?: string;
  impact?: string;
  description?: string;
  priority?: 'HIGH' | 'MED' | 'LOW';
  complexity?: 'HIGH' | 'MED' | 'LOW';
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { briefId, ...patch }: { briefId: string } & PipelineItemPatch = body;

    if (!briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    }

    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }

    const queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
    const idx = (queueData.briefs || []).findIndex((b: { id: string }) => b.id === briefId);

    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    // Only allow editing pending-review items
    if (queueData.briefs[idx].status !== 'pending-review') {
      return NextResponse.json({ error: 'Only pending-review briefs can be edited' }, { status: 400 });
    }

    const allowedFields: (keyof PipelineItemPatch)[] = ['title', 'problem', 'solution', 'impact', 'description', 'priority', 'complexity'];
    for (const field of allowedFields) {
      if (patch[field] !== undefined) {
        queueData.briefs[idx][field] = patch[field];
      }
    }

    // Keep description in sync with problem+solution if not explicitly set
    if ((patch.problem || patch.solution) && !patch.description) {
      const p = queueData.briefs[idx].problem || '';
      const s = queueData.briefs[idx].solution || '';
      queueData.briefs[idx].description = `${p}\n\n${s}`.trim();
    }

    queueData.briefs[idx].editedAt = new Date().toISOString();
    queueData.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, briefId, updated: queueData.briefs[idx] });
  } catch (error) {
    console.error('pipeline-queue update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
