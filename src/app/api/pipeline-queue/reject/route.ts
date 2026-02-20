import { NextResponse } from 'next/server';
import { existsSync, readdirSync, renameSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_DIR = join(homedir(), '.openclaw', 'shared', 'archive', 'rejected-briefs');
const BRIEF_LOG_PATH = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'brief-log.md');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rejectReason, rejectComment } = body;

    if (!briefId) return NextResponse.json({ error: 'briefId is required' }, { status: 400 });

    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });

    const now = new Date();
    await db.brief.update({
      where: { id: briefId },
      data: {
        status: 'rejected',
        rejectedAt: now,
        rejectReason: rejectReason || null,
        rejectComment: rejectComment || null,
        rejectedReason: rejectComment || null, // legacy compat
      },
    });

    // Archive spec-brief file if found
    let movedFile: string | null = null;
    const idSlug = briefId.replace(/^brief-\d{4}-\d{2}-\d{2}-/, '');
    if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });
    if (existsSync(SPEC_BRIEFS_DIR)) {
      const match = readdirSync(SPEC_BRIEFS_DIR).find(f => f.endsWith('.md') && (f.includes(idSlug) || f === brief.briefPath));
      if (match) {
        const src = join(SPEC_BRIEFS_DIR, match);
        const dst = join(ARCHIVE_DIR, match);
        renameSync(src, dst);
        movedFile = dst;
      }
    }

    // Log to DB activity
    await db.pipelineActivity.create({
      data: {
        type: 'brief_rejected',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '❌',
        message: `PJ rejected brief: "${brief.title}"${rejectComment ? ` — ${rejectComment}` : ''}${rejectReason ? ` [${rejectReason}]` : ''}`,
        briefId,
        metadata: JSON.stringify({ rejectReason, rejectComment, movedFile }),
      },
    });

    // Append to brief-log.md for learning
    if (rejectComment || rejectReason) {
      const today = now.toISOString().slice(0, 10);
      const entry = `\n## Rejected: ${brief.title}\n- **Date:** ${today}\n- **Reason:** ${rejectComment || 'No comment'}\n- **Reason Type:** ${rejectReason || 'none'}\n- **Source:** ${brief.source || 'unknown'}\n`;
      try {
        const { readFileSync, writeFileSync, existsSync: ex } = await import('fs');
        const existing = ex(BRIEF_LOG_PATH) ? readFileSync(BRIEF_LOG_PATH, 'utf-8') : '# Brief Log\n';
        writeFileSync(BRIEF_LOG_PATH, existing + entry, 'utf-8');
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, briefId, newStatus: 'rejected', archivedFile: movedFile, reasonLogged: !!(rejectComment || rejectReason) });
  } catch (error) {
    console.error('pipeline-queue reject error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
