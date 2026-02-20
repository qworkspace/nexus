import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const HOME = homedir();
const LESSONS_PATH = join(HOME, '.openclaw', 'workspace', 'LESSONS.md');
const SPEC_BRIEFS_DIR = join(HOME, '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');

const VALID_RATINGS = ['nailed-it', 'acceptable', 'needs-work'] as const;
type Rating = typeof VALID_RATINGS[number];

const VALID_TAGS = [
  'missed-spec', 'broke-existing', 'wrong-approach', 'incomplete',
  'over-engineered', 'poor-quality', 'needed-context',
] as const;
type Tag = typeof VALID_TAGS[number];

function appendToLessons(feature: string, rating: Rating, tags: Tag[], comment?: string) {
  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney',
  });
  const ratingEmoji = rating === 'needs-work' ? '🔴 Needs work' : '🟡 Acceptable';
  const tagList = tags.join(', ') || '(none)';
  const actionMap: Record<Tag, string> = {
    'missed-spec': 'Cipher should validate all input constraints from spec before building',
    'broke-existing': 'Spark should run regression checks before marking build complete',
    'wrong-approach': 'Cipher should explore alternative architectures in spec before committing',
    'incomplete': 'Spark must cover edge cases, not just the happy path',
    'over-engineered': 'Cipher should flag complexity vs scope mismatch in the spec',
    'poor-quality': 'Spark should self-review for readability before shipping',
    'needed-context': 'Q should proactively share relevant LESSONS.md entries when spawning agents',
  };
  const action = tags.length > 0 ? (actionMap[tags[0]] || 'Review the approach before next iteration') : 'Review what went wrong and update approach';
  const entry = `\n## ${date} — ${feature} (${ratingEmoji})\n**Tags:** ${tagList}\n**Comment:** ${comment || '(none)'}\n**Action:** ${action}\n\n`;
  try {
    if (existsSync(LESSONS_PATH)) {
      writeFileSync(LESSONS_PATH, readFileSync(LESSONS_PATH, 'utf-8') + entry, 'utf-8');
    } else {
      writeFileSync(LESSONS_PATH, `# LESSONS.md\n${entry}`, 'utf-8');
    }
  } catch (e) {
    console.error('Failed to append to LESSONS.md:', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rating, tags = [], comment, screenshotPath } = body;

    if (!briefId || !rating) {
      return NextResponse.json({ error: 'briefId and rating are required' }, { status: 400 });
    }
    if (!VALID_RATINGS.includes(rating)) {
      return NextResponse.json({ error: `rating must be one of: ${VALID_RATINGS.join(', ')}` }, { status: 400 });
    }
    const invalidTags = tags.filter((t: string) => !VALID_TAGS.includes(t as Tag));
    if (invalidTags.length > 0) {
      return NextResponse.json({ error: `Invalid tags: ${invalidTags.join(', ')}` }, { status: 400 });
    }
    if (rating === 'needs-work' && tags.length === 0) {
      return NextResponse.json({ error: 'At least one tag is required for needs-work rating' }, { status: 400 });
    }

    // Find brief in DB
    const brief = await db.brief.findUnique({ where: { id: briefId } });
    if (!brief) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    // Store feedback in DB
    await db.buildFeedback.create({
      data: {
        briefId,
        rating,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        comment: comment || null,
        screenshot: screenshotPath || null,
        ratedBy: 'PJ',
        commitMessage: brief.title,
      },
    });

    // Update brief with inline feedback metadata
    const feedbackMeta = {
      rating,
      tags: tags.length > 0 ? tags : undefined,
      comment: comment || undefined,
      screenshotPath: screenshotPath || undefined,
      rolledBack: false,
      ratedAt: new Date().toISOString(),
    };
    await db.brief.update({
      where: { id: briefId },
      data: { metadata: JSON.stringify({ ...(brief.metadata ? JSON.parse(brief.metadata) : {}), feedback: feedbackMeta }) },
    });

    // Auto-append to LESSONS.md on needs-work or acceptable
    if (rating === 'needs-work' || rating === 'acceptable') {
      appendToLessons(brief.title, rating, tags, comment);
    }

    // Log activity
    await db.pipelineActivity.create({
      data: {
        type: 'build_feedback',
        agent: 'nexus',
        agentName: 'Nexus',
        emoji: rating === 'nailed-it' ? '🟢' : rating === 'acceptable' ? '🟡' : '🔴',
        message: `PJ rated "${brief.title}" ${rating}${tags.length ? ` [${tags.join(', ')}]` : ''}`,
        briefId,
      },
    });

    // Auto-generate fix brief on needs-work
    if (rating === 'needs-work') {
      const today = new Date().toISOString().slice(0, 10);
      const safeOriginalId = briefId.replace(/[^a-z0-9-]/gi, '-').slice(0, 40);
      const fixBriefId = `brief-${today}-fix-${safeOriginalId}`;
      const fixBriefFilename = `${today}-fix-${safeOriginalId}.md`;
      const fixBriefPath = join(SPEC_BRIEFS_DIR, fixBriefFilename);

      const tagDescriptions: Record<string, string> = {
        'missed-spec': 'Did not meet the original spec requirements',
        'broke-existing': 'Broke existing functionality',
        'wrong-approach': 'Wrong technical approach taken',
        'incomplete': 'Build is incomplete / partial',
        'over-engineered': 'Unnecessarily complex',
        'poor-quality': 'Code quality issues',
        'needed-context': 'Agent lacked context to do the job properly',
      };
      const tagLines = tags.map((t: string) => `- ${t} → ${tagDescriptions[t] || t}`).join('\n');
      const screenshotLine = screenshotPath ? `**Screenshot:** ${screenshotPath}` : '**Screenshot:** none';

      const fixBriefContent = `# Fix: ${brief.title}\n\n**Status:** pending-review\n**Priority:** HIGH\n**Complexity:** TBD (Q to assess)\n**Front:** ${brief.front || 'infrastructure'}\n**Source:** needs-work-rating\n**Parent Build:** ${briefId}${brief.buildCommit ? ` (${brief.buildCommit})` : ''}\n\n## Problem\nBuild was rated 🔴 Needs Work on ${today}.\n\n**Tags:** ${tags.join(', ')}\n**Comment:** ${comment || '(none)'}\n${screenshotLine}\n\n## What Needs Fixing\n${tagLines || '- (see comment)'}\n\n## Original Brief\n${brief.briefPath ? `Path: ${brief.briefPath}` : `ID: ${briefId}`}\n\n## Lineage\n- Parent: ${briefId}\n- Rating: 🔴 Needs Work — ${today}\n- Auto-generated by Performance Feedback Loop\n`;

      if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
      writeFileSync(fixBriefPath, fixBriefContent, 'utf-8');

      // Create fix brief in DB
      await db.brief.create({
        data: {
          id: fixBriefId,
          title: `Fix: ${brief.title}`,
          description: `Auto-generated fix brief from 🔴 Needs Work rating on ${today}. Tags: ${tags.join(', ')}.`,
          problem: `Build "${brief.title}" was rated 🔴 Needs Work on ${today}.${comment ? ` PJ's comment: ${comment}` : ''}`,
          solution: `Fix the issues identified: ${tags.map((t: string) => tagDescriptions[t] || t).join('; ')}.`,
          source: 'needs-work-rating',
          sourceRef: fixBriefFilename,
          status: 'pending-review',
          priority: 'HIGH',
          front: brief.front || null,
          metadata: JSON.stringify({ parentBuildId: briefId, screenshotPath: screenshotPath || undefined }),
        },
      });

      return NextResponse.json({ ok: true, briefId, rating, fixBriefId, fixBriefPath });
    }

    return NextResponse.json({ ok: true, briefId, rating });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
