import { NextResponse } from 'next/server';
import { previewIngest, ingestAllBriefs } from '@/lib/spec-brief-ingest';

/**
 * GET /api/pipeline-queue/ingest
 * Preview what would be ingested without actually ingesting.
 */
export async function GET() {
  try {
    const { preview, total } = await previewIngest();
    return NextResponse.json({ ok: true, preview, total });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/pipeline-queue/ingest
 * Ingest all new spec-briefs into the database.
 * This endpoint remains for manual "Ingest New" button clicks.
 */
export async function POST() {
  try {
    const { ingested, items, total } = await ingestAllBriefs();
    return NextResponse.json({ ok: true, ingested, items, total });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
