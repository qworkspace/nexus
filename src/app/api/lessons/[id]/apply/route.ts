import { NextResponse } from 'next/server';
import { loadLessonsDatabase, applyLesson } from '@/lib/lessons-parser';
import { writeFile } from 'fs/promises';

const LESSONS_MD_PATH = `${process.env.HOME}/.openclaw/workspace/LESSONS.md`;
const TRACKING_JSON_PATH = `${process.env.HOME}/.openclaw/workspace/memory/lessons-tracking.json`;

interface ApplyLessonRequest {
  context: string;
  success: boolean;
  notes?: string;
}

// POST /api/lessons/[id]/apply - Log lesson application
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    const body: ApplyLessonRequest = await request.json();

    if (!body.context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // Load current lessons
    const database = await loadLessonsDatabase(
      LESSONS_MD_PATH,
      TRACKING_JSON_PATH
    );

    // Apply the lesson
    const updatedLessons = applyLesson(
      database.lessons,
      lessonId,
      body.context,
      body.success !== undefined ? body.success : true,
      body.notes
    );

    // Find the updated lesson
    const updatedLesson = updatedLessons.find((l) => l.id === lessonId);
    if (!updatedLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Save updated tracking data
    const updatedDatabase = {
      lessons: updatedLessons,
      lastUpdated: new Date().toISOString(),
    };

    await writeFile(TRACKING_JSON_PATH, JSON.stringify(updatedDatabase, null, 2));

    return NextResponse.json({
      lesson: updatedLesson,
      message: 'Lesson application logged',
    });
  } catch (error) {
    console.error('Failed to apply lesson:', error);
    return NextResponse.json(
      { error: 'Failed to apply lesson', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
