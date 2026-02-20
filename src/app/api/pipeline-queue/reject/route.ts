import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');
const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');
const ARCHIVE_DIR = join(homedir(), '.openclaw', 'shared', 'archive', 'rejected-briefs');
const ACTIVITY_FEED_PATH = join(homedir(), '.openclaw', 'shared', 'activity-feed.json');

interface PipelineQueueItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  specPath?: string;
}

const BRIEF_LOG_PATH = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'brief-log.md');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rejectReason, rejectComment } = body;

    if (!briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    }

    // 1. Load and update pipeline-queue.json
    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }
    const queueRaw = readFileSync(QUEUE_PATH, 'utf-8');
    const queueData = JSON.parse(queueRaw);

    const idx = (queueData.briefs || []).findIndex(
      (b: PipelineQueueItem) => b.id === briefId
    );
    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    const item: PipelineQueueItem = queueData.briefs[idx];
    queueData.briefs[idx].status = 'rejected';
    queueData.briefs[idx].rejectedAt = new Date().toISOString();
    queueData.briefs[idx].rejectReason = rejectReason || undefined; // NEW: reason type
    queueData.briefs[idx].rejectComment = rejectComment || undefined; // NEW: optional comment
    if (rejectComment) queueData.briefs[idx].rejectedReason = rejectComment; // OLD: backward compatibility
    queueData.updated = new Date().toISOString();
    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    // 2. Move spec-brief file to archive (if it exists)
    // Search spec-briefs dir for a file whose name contains the brief id slug
    let movedFile: string | null = null;
    const idSlug = briefId.replace(/^brief-\d{4}-\d{2}-\d{2}-/, ''); // strip "brief-YYYY-MM-DD-" prefix

    if (!existsSync(ARCHIVE_DIR)) {
      mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    if (existsSync(SPEC_BRIEFS_DIR)) {
      const files = readdirSync(SPEC_BRIEFS_DIR).filter(f => f.endsWith('.md'));
      const matchedFile = files.find(f => f.includes(idSlug) || (item.specPath && f === item.specPath));

      if (matchedFile) {
        const srcPath = join(SPEC_BRIEFS_DIR, matchedFile);
        const destPath = join(ARCHIVE_DIR, matchedFile);
        renameSync(srcPath, destPath);
        movedFile = destPath;
      }
    }

    // 3. Activity feed entry
    let feedData: { entries: object[] } = { entries: [] };
    if (existsSync(ACTIVITY_FEED_PATH)) {
      const feedRaw = readFileSync(ACTIVITY_FEED_PATH, 'utf-8');
      feedData = JSON.parse(feedRaw);
      if (!Array.isArray(feedData.entries)) feedData.entries = [];
    }
    feedData.entries.unshift({
      id: `nexus-reject-${briefId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'brief_rejected',
      agent: 'nexus',
      agentName: 'Nexus',
      emoji: '❌',
      message: `PJ rejected brief: "${item.title}"${rejectComment ? ` — ${rejectComment}` : ''}${rejectReason ? ` — Type: ${rejectReason}` : ''}${movedFile ? ` — moved to archive` : ''}.`,
      briefId: item.id,
      rejectedReason: rejectComment || null,
      rejectReasonType: rejectReason || null,
    });
    writeFileSync(ACTIVITY_FEED_PATH, JSON.stringify(feedData, null, 2), 'utf-8');

    // 4. Append rejection reason to brief-log.md for learning
    if (rejectComment || rejectReason) {
      const today = new Date().toISOString().slice(0, 10);
      const itemAny = item as unknown as Record<string, unknown>;
      const logEntry = `\n## Rejected: ${item.title}\n- **Date:** ${today}\n- **Reason:** ${rejectComment || 'No comment'}\n- **Reason Type:** ${rejectReason || 'none'}\n- **Source:** ${String(itemAny.source || 'unknown')}\n`;
      try {
        const existing = existsSync(BRIEF_LOG_PATH) ? readFileSync(BRIEF_LOG_PATH, 'utf-8') : '# Brief Log\n';
        writeFileSync(BRIEF_LOG_PATH, existing + logEntry, 'utf-8');
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({
      ok: true,
      briefId: item.id,
      newStatus: 'rejected',
      archivedFile: movedFile,
      reasonLogged: !!reason,
    });

  } catch (error) {
    console.error('pipeline-queue reject error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
