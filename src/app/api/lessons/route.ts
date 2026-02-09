import { NextResponse } from 'next/server';
import { loadLessonsDatabase, getTopLessonsForReview } from '@/lib/lessons-parser';

const LESSONS_MD_PATH = `${process.env.HOME}/.openclaw/workspace/LESSONS.md`;
const TRACKING_JSON_PATH = `${process.env.HOME}/.openclaw/workspace/memory/lessons-tracking.json`;

// GET /api/lessons - Fetch all lessons
export async function GET() {
  try {
    const database = await loadLessonsDatabase(LESSONS_MD_PATH, TRACKING_JSON_PATH);

    // Get top lessons for session start
    const topLessons = await getTopLessonsForReview(database.lessons, 5);

    return NextResponse.json({
      lessons: database.lessons,
      topLessons,
      lastUpdated: database.lastUpdated,
    });
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
