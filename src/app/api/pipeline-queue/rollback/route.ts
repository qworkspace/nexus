import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const HOME = homedir();
const FLUX_LOG_PATH = join(HOME, '.openclaw', 'shared', 'pipeline', 'flux-log.json');
const LESSONS_PATH = join(HOME, '.openclaw', 'workspace', 'LESSONS.md');

function getProjectDir(): string {
  return join(HOME, '.openclaw', 'projects', 'nexus');
}

function appendRollbackToLessons(feature: string, comment: string) {
  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney',
  });
  const entry = `\n## ${date} — ${feature} (⏪ Rolled Back)\n**Tags:** broke-existing\n**Comment:** ${comment}\n**Action:** Spark should run full regression checks before marking build complete.\n\n`;
  try {
    if (existsSync(LESSONS_PATH)) {
      writeFileSync(LESSONS_PATH, readFileSync(LESSONS_PATH, 'utf-8') + entry, 'utf-8');
    } else {
      writeFileSync(LESSONS_PATH, `# LESSONS.md\n${entry}`, 'utf-8');
    }
  } catch (e) {
    console.error('Failed to append rollback to LESSONS.md:', e);
  }
}

export async function POST(request: Request) {
  try {
    const { briefId, comment } = await request.json();

    if (!briefId) return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    if (!comment?.trim()) return NextResponse.json({ error: 'comment is required for rollback' }, { status: 400 });

    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    if (!brief.buildCommit) return NextResponse.json({ error: 'No buildCommit recorded — cannot rollback' }, { status: 400 });

    const commitHash = brief.buildCommit;
    const projectDir = getProjectDir();

    // Run git revert
    let revertOutput = '';
    try {
      revertOutput = execSync(`git -C "${projectDir}" revert --no-edit ${commitHash}`, { encoding: 'utf-8', timeout: 30000 });
    } catch (gitError: unknown) {
      const errMsg = gitError instanceof Error ? gitError.message : String(gitError);
      return NextResponse.json({ error: `git revert failed: ${errMsg}` }, { status: 500 });
    }

    // Update brief in DB
    const feedbackMeta = {
      rating: 'needs-work',
      tags: ['broke-existing'],
      comment: comment.trim(),
      rolledBack: true,
      ratedAt: new Date().toISOString(),
    };
    await db.brief.update({
      where: { id: briefId },
      data: {
        metadata: JSON.stringify({
          ...(brief.metadata ? JSON.parse(brief.metadata) : {}),
          feedback: feedbackMeta,
          rolledBackAt: new Date().toISOString(),
        }),
      },
    });

    // Store feedback in DB
    await db.buildFeedback.create({
      data: {
        briefId,
        rating: 'needs-work',
        tags: JSON.stringify(['broke-existing']),
        comment: comment.trim(),
        ratedBy: 'PJ',
        commitMessage: `Rollback: ${brief.title}`,
      },
    });

    // Log activity
    await db.pipelineActivity.create({
      data: {
        type: 'rollback',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: '⏪',
        message: `PJ rolled back "${brief.title}" (${commitHash.slice(0, 7)}) — ${comment.trim()}`,
        briefId,
      },
    });

    // Log to flux-log.json (non-critical)
    try {
      if (existsSync(FLUX_LOG_PATH)) {
        const fluxData = JSON.parse(readFileSync(FLUX_LOG_PATH, 'utf-8'));
        if (Array.isArray(fluxData)) {
          fluxData.unshift({ timestamp: new Date().toISOString(), event: 'rollback', briefId, feature: brief.title, commitHash, comment: comment.trim(), revertOutput: revertOutput.trim() });
          writeFileSync(FLUX_LOG_PATH, JSON.stringify(fluxData, null, 2), 'utf-8');
        }
      }
    } catch { /* non-fatal */ }

    appendRollbackToLessons(brief.title, comment.trim());

    return NextResponse.json({ ok: true, briefId, commitHash, revertOutput: revertOutput.trim(), note: 'Build reverted, rating set to needs-work, LESSONS.md updated' });
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
