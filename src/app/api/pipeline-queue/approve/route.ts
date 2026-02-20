import { NextResponse } from 'next/server';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const { briefId } = await request.json();
    if (!briefId) return NextResponse.json({ error: 'briefId is required' }, { status: 400 });

    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });

    const now = new Date();

    // pending-review → queued
    if (brief.status === 'pending-review') {
      await db.brief.update({ where: { id: briefId }, data: { status: 'queued', approvedAt: now } });
      await db.pipelineActivity.create({
        data: {
          type: 'brief_approved',
          agent: 'nexus',
          agentName: 'Nexus',
          emoji: '✅',
          message: `PJ approved brief: "${brief.title}" — moved to queued.`,
          briefId,
        },
      });
      return NextResponse.json({ ok: true, briefId, newStatus: 'queued', note: 'Brief approved and queued.' });
    }

    // queued → speccing (writes spec trigger file + activity)
    await db.brief.update({ where: { id: briefId }, data: { status: 'speccing' } });

    const today = now.toISOString().slice(0, 10);
    const slug = slugify(brief.title);
    const briefFilename = `${today}-${slug}.md`;
    const briefPath = join(SPEC_BRIEFS_DIR, briefFilename);

    if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
    if (!existsSync(briefPath)) {
      writeFileSync(briefPath, `# ${brief.title}\n\n**Status:** queued\n**Priority:** ${brief.priority}\n**Created:** ${today}\n**PipelineQueueId:** ${brief.id}\n\n## Brief\n\n${brief.description || ''}\n\n## Assignee Chain\n\nCipher (spec) → Spark (build) → Flux (QA)\n`, 'utf-8');
    }

    await db.pipelineActivity.create({
      data: {
        type: 'brief_approved',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '✅',
        message: `PJ approved brief from Nexus: "${brief.title}". Cipher spawn needed.`,
        briefId,
        metadata: JSON.stringify({ briefPath }),
      },
    });

    return NextResponse.json({ ok: true, briefId, newStatus: 'speccing', briefPath, note: 'Q will see the activity and spawn Cipher.' });
  } catch (error) {
    console.error('pipeline-queue approve error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
