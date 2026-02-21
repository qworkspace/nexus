import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { briefToJson } from '@/lib/brief-utils';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = [
  'pending-review', 'queued', 'speccing', 'building', 
  'qa', 'shipped', 'rejected', 'deferred', 'parked', 'archived'
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }
    
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 });
    }
    
    const existing = await db.brief.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: `Brief ${id} not found` }, { status: 404 });
    }
    
    const updated = await db.brief.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json({ ok: true, brief: briefToJson(updated) });
  } catch (error) {
    console.error('pipeline-queue status PATCH error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
