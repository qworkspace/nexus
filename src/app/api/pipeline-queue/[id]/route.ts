import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existing = await db.brief.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: `Brief ${id} not found` }, { status: 404 });
    }
    
    await db.brief.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('pipeline-queue DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
