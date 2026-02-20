import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const entries = await db.pipelineActivity.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      entries: entries.map(e => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        type: e.type,
        agent: e.agent,
        agentName: e.agentName,
        emoji: e.emoji,
        message: e.message,
        briefId: e.briefId,
        ...(e.metadata ? JSON.parse(e.metadata) : {}),
      })),
    });
  } catch (error) {
    return NextResponse.json({ entries: [], error: String(error) });
  }
}
