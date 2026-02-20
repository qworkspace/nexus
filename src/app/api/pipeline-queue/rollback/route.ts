import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const QUEUE_PATH = join(HOME, '.openclaw', 'shared', 'pipeline-queue.json');
const FLUX_LOG_PATH = join(HOME, '.openclaw', 'shared', 'pipeline', 'flux-log.json');
const LESSONS_PATH = join(HOME, '.openclaw', 'workspace', 'LESSONS.md');
const BUILD_FEEDBACK_PATH = join(HOME, '.openclaw', 'shared', 'pipeline', 'build-feedback.json');

// Resolve project directory from brief's specPath or a known mapping
function getProjectDir(): string {
  // Default: nexus project
  const nexusPath = join(HOME, '.openclaw', 'projects', 'nexus');
  return nexusPath;
}

function appendRollbackToLessons(feature: string, comment: string) {
  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney',
  });

  const entry = `
## ${date} — ${feature} (⏪ Rolled Back)
**Tags:** broke-existing
**Comment:** ${comment}
**Action:** Spark should run full regression checks before marking build complete. Review what caused the regression.

`;

  try {
    if (existsSync(LESSONS_PATH)) {
      const current = readFileSync(LESSONS_PATH, 'utf-8');
      writeFileSync(LESSONS_PATH, current + entry, 'utf-8');
    } else {
      writeFileSync(LESSONS_PATH, `# LESSONS.md\n${entry}`, 'utf-8');
    }
  } catch (e) {
    console.error('Failed to append rollback to LESSONS.md:', e);
  }
}

function updateBuildFeedbackRolledBack(briefId: string) {
  try {
    if (!existsSync(BUILD_FEEDBACK_PATH)) return;
    const data = JSON.parse(readFileSync(BUILD_FEEDBACK_PATH, 'utf-8'));
    if (Array.isArray(data.feedback)) {
      const idx = data.feedback.findIndex((f: { buildId: string }) => f.buildId === briefId);
      if (idx !== -1) {
        (data.feedback[idx] as Record<string, unknown>).rolledBack = true;
        writeFileSync(BUILD_FEEDBACK_PATH, JSON.stringify(data, null, 2), 'utf-8');
      }
    }
  } catch (e) {
    console.error('Failed to update build-feedback.json rollback flag:', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, comment } = body;

    if (!briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    }
    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'comment is required for rollback' }, { status: 400 });
    }

    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }

    const queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
    const idx = (queueData.briefs || []).findIndex((b: { id: string }) => b.id === briefId);

    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    const brief = queueData.briefs[idx];

    // Require a commit hash to rollback
    if (!brief.buildCommit) {
      return NextResponse.json(
        { error: 'No buildCommit recorded for this brief — cannot rollback' },
        { status: 400 }
      );
    }

    const commitHash = brief.buildCommit;
    const projectDir = getProjectDir();

    // Run git revert
    let revertOutput = '';
    try {
      revertOutput = execSync(`git -C "${projectDir}" revert --no-edit ${commitHash}`, {
        encoding: 'utf-8',
        timeout: 30000,
      });
    } catch (gitError: unknown) {
      const errMsg = gitError instanceof Error ? gitError.message : String(gitError);
      return NextResponse.json(
        { error: `git revert failed: ${errMsg}` },
        { status: 500 }
      );
    }

    // Update pipeline-queue.json: auto-set rating to needs-work + broke-existing + comment
    queueData.briefs[idx].feedback = {
      rating: 'needs-work',
      tags: ['broke-existing'],
      comment: comment.trim(),
      rolledBack: true,
      ratedAt: new Date().toISOString(),
    };
    queueData.briefs[idx].rolledBackAt = new Date().toISOString();
    queueData.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    // Log to flux-log.json
    try {
      if (existsSync(FLUX_LOG_PATH)) {
        const fluxData = JSON.parse(readFileSync(FLUX_LOG_PATH, 'utf-8'));
        const rollbackEntry = {
          timestamp: new Date().toISOString(),
          event: 'rollback',
          briefId,
          feature: brief.title,
          commitHash,
          comment: comment.trim(),
          revertOutput: revertOutput.trim(),
        };
        // flux-log.json might be an object (single record) or array
        if (Array.isArray(fluxData)) {
          fluxData.unshift(rollbackEntry);
          writeFileSync(FLUX_LOG_PATH, JSON.stringify(fluxData, null, 2), 'utf-8');
        }
        // If it's a single object (as found in codebase), leave it — just log the event elsewhere
      }
    } catch (e) {
      console.error('Failed to update flux-log.json:', e);
    }

    // Append to LESSONS.md
    appendRollbackToLessons(brief.title, comment.trim());

    // Update build-feedback.json rolledBack flag
    updateBuildFeedbackRolledBack(briefId);

    return NextResponse.json({
      ok: true,
      briefId,
      commitHash,
      revertOutput: revertOutput.trim(),
      note: 'Build reverted, rating set to needs-work, LESSONS.md updated',
    });
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
