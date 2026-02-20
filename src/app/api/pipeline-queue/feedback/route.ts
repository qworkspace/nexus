import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const QUEUE_PATH = join(HOME, '.openclaw', 'shared', 'pipeline-queue.json');
const BUILD_FEEDBACK_PATH = join(HOME, '.openclaw', 'shared', 'pipeline', 'build-feedback.json');
const LESSONS_PATH = join(HOME, '.openclaw', 'workspace', 'LESSONS.md');

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

  // Derive action hint from tags
  const actionMap: Record<Tag, string> = {
    'missed-spec': 'Cipher should validate all input constraints from spec before building',
    'broke-existing': 'Spark should run regression checks before marking build complete',
    'wrong-approach': 'Cipher should explore alternative architectures in spec before committing',
    'incomplete': 'Spark must cover edge cases, not just the happy path',
    'over-engineered': 'Cipher should flag complexity vs scope mismatch in the spec',
    'poor-quality': 'Spark should self-review for readability before shipping',
    'needed-context': 'Q should proactively share relevant LESSONS.md entries when spawning agents',
  };
  const action = tags.length > 0
    ? (actionMap[tags[0]] || 'Review the approach before next iteration')
    : 'Review what went wrong and update approach';

  const entry = `
## ${date} — ${feature} (${ratingEmoji})
**Tags:** ${tagList}
**Comment:** ${comment || '(none)'}
**Action:** ${action}

`;

  try {
    if (existsSync(LESSONS_PATH)) {
      const current = readFileSync(LESSONS_PATH, 'utf-8');
      writeFileSync(LESSONS_PATH, current + entry, 'utf-8');
    } else {
      // Create LESSONS.md if it doesn't exist
      writeFileSync(LESSONS_PATH, `# LESSONS.md\n${entry}`, 'utf-8');
    }
  } catch (e) {
    console.error('Failed to append to LESSONS.md:', e);
  }
}

function appendToBuildFeedback(
  briefId: string,
  feature: string,
  rating: Rating,
  tags: Tag[],
  comment?: string
) {
  try {
    const dir = join(HOME, '.openclaw', 'shared', 'pipeline');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    let feedbackData: { ratings?: object[]; feedback?: object[] } = { ratings: [], feedback: [] };
    if (existsSync(BUILD_FEEDBACK_PATH)) {
      feedbackData = JSON.parse(readFileSync(BUILD_FEEDBACK_PATH, 'utf-8'));
    }
    if (!Array.isArray(feedbackData.feedback)) feedbackData.feedback = [];

    const entry = {
      buildId: briefId,
      feature,
      rating,
      tags,
      comment: comment || undefined,
      rolledBack: false,
      timestamp: new Date().toISOString(),
    };

    (feedbackData.feedback as object[]).unshift(entry);
    writeFileSync(BUILD_FEEDBACK_PATH, JSON.stringify(feedbackData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to append to build-feedback.json:', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rating, tags = [], comment } = body;

    if (!briefId || !rating) {
      return NextResponse.json({ error: 'briefId and rating are required' }, { status: 400 });
    }

    if (!VALID_RATINGS.includes(rating)) {
      return NextResponse.json(
        { error: `rating must be one of: ${VALID_RATINGS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate tags
    const invalidTags = tags.filter((t: string) => !VALID_TAGS.includes(t as Tag));
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: `Invalid tags: ${invalidTags.join(', ')}` },
        { status: 400 }
      );
    }

    // Require at least one tag for 'needs-work'
    if (rating === 'needs-work' && tags.length === 0) {
      return NextResponse.json(
        { error: 'At least one tag is required for needs-work rating' },
        { status: 400 }
      );
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

    queueData.briefs[idx].feedback = {
      rating,
      tags: tags.length > 0 ? tags : undefined,
      comment: comment || undefined,
      rolledBack: false,
      ratedAt: new Date().toISOString(),
    };
    queueData.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    // Auto-append to LESSONS.md on 'needs-work' or 'acceptable'
    if (rating === 'needs-work' || rating === 'acceptable') {
      appendToLessons(brief.title, rating, tags, comment);
    }

    // Also log to build-feedback.json
    appendToBuildFeedback(briefId, brief.title, rating, tags, comment);

    return NextResponse.json({ ok: true, briefId, rating });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
