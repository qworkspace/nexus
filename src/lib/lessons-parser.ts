import { readFile } from 'fs/promises';

export interface Lesson {
  id: string;
  category: string;
  pattern: string;
  rule: string;
  added: string;
  fix?: string;
  applications: number;
  lastApplied: string | null;
  successCount: number;
  failureCount: number;
  effectiveness: number | null;
  applicationLog: ApplicationLog[];
}

export interface ApplicationLog {
  timestamp: string;
  context: string;
  success: boolean;
  notes?: string;
}

export interface LessonsDatabase {
  lessons: Lesson[];
  lastUpdated: string;
}

// Generate a consistent ID from category and pattern
function generateLessonId(category: string, pattern: string): string {
  const slug = category.toLowerCase().replace(/\s+/g, '-');
  const patternSlug = pattern
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 50);
  return `${slug}-${patternSlug}`;
}

// Parse LESSONS.md and extract lessons
export async function parseLessonsMd(lessonsPath: string): Promise<Lesson[]> {
  try {
    const content = await readFile(lessonsPath, 'utf-8');
    const lessons: Lesson[] = [];

    // Split by category headers (## Category)
    const categorySections = content.split(/^##\s+(.+)$/gm);

    for (let i = 1; i < categorySections.length; i += 2) {
      const category = categorySections[i].trim();
      const sectionContent = categorySections[i + 1] || '';

      // Split by pattern headers (### Pattern: ...)
      const patternSections = sectionContent.split(/^###\s+Pattern:\s+(.+)$/gm);

      for (let j = 1; j < patternSections.length; j += 2) {
        const pattern = patternSections[j].trim();
        const patternContent = patternSections[j + 1] || '';

        // Extract Rule
        const ruleMatch = patternContent.match(/\*\*Rule:\*\*\s*(.+?)(?=\n\n|\n\*\*|\n---|$)/s);
        const rule = ruleMatch ? ruleMatch[1].trim() : '';

        // Extract Added date
        const addedMatch = patternContent.match(/\*\*Added:\*\*\s*(\d{4}-\d{2}-\d{2})/);
        const added = addedMatch ? addedMatch[1] : new Date().toISOString().split('T')[0];

        // Extract Fix (optional)
        const fixMatch = patternContent.match(/\*\*Fix:\*\*\s*(.+?)(?=\n\n|\n\*\*|\n---|$)/s);
        const fix = fixMatch ? fixMatch[1].trim() : undefined;

        const lesson: Lesson = {
          id: generateLessonId(category, pattern),
          category,
          pattern,
          rule,
          added,
          fix,
          applications: 0,
          lastApplied: null,
          successCount: 0,
          failureCount: 0,
          effectiveness: null,
          applicationLog: [],
        };

        lessons.push(lesson);
      }
    }

    return lessons;
  } catch (error) {
    console.error('Failed to parse LESSONS.md:', error);
    throw error;
  }
}

// Merge parsed lessons with tracking data
export async function loadLessonsDatabase(
  lessonsMdPath: string,
  trackingJsonPath: string
): Promise<LessonsDatabase> {
  try {
    // Parse LESSONS.md
    const parsedLessons = await parseLessonsMd(lessonsMdPath);

    // Load tracking data
    let trackingData: Partial<LessonsDatabase> = {};
    try {
      const trackingContent = await readFile(trackingJsonPath, 'utf-8');
      trackingData = JSON.parse(trackingContent);
    } catch {
      // Tracking file might not exist yet, that's okay
      console.log('No existing tracking data, starting fresh');
    }

    // Merge: Use tracking data for stats, but keep parsed lessons as source of truth
    const lessonsMap = new Map<string, Lesson>();

    // Add parsed lessons
    for (const lesson of parsedLessons) {
      lessonsMap.set(lesson.id, lesson);
    }

    // Apply tracking data
    if (trackingData.lessons) {
      for (const trackedLesson of trackingData.lessons) {
        const lesson = lessonsMap.get(trackedLesson.id);
        if (lesson) {
          lesson.applications = trackedLesson.applications || 0;
          lesson.lastApplied = trackedLesson.lastApplied || null;
          lesson.successCount = trackedLesson.successCount || 0;
          lesson.failureCount = trackedLesson.failureCount || 0;
          lesson.effectiveness = trackedLesson.effectiveness || null;
          lesson.applicationLog = trackedLesson.applicationLog || [];
        }
      }
    }

    return {
      lessons: Array.from(lessonsMap.values()),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to load lessons database:', error);
    throw error;
  }
}

// Calculate effectiveness from success/failure counts
export function calculateEffectiveness(
  successCount: number,
  applications: number
): number | null {
  if (applications === 0) return null;
  return Math.round((successCount / applications) * 100);
}

// Get top 5 lessons to review at session start
export async function getTopLessonsForReview(
  lessons: Lesson[],
  limit: number = 5
): Promise<Lesson[]> {
  // Prioritize:
  // 1. Lessons with effectiveness < 80% (need improvement)
  // 2. Lessons not applied in 7 days (need refresh)
  // 3. Most recently added lessons
  // 4. Lessons with fewest applications

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const scored = lessons.map((lesson) => {
    let priority = 0;

    // Low effectiveness = high priority
    if (lesson.effectiveness !== null && lesson.effectiveness < 80) {
      priority += 100 + (80 - lesson.effectiveness);
    }

    // Not applied recently = medium priority
    if (lesson.lastApplied === null) {
      priority += 50;
    } else if (new Date(lesson.lastApplied) < sevenDaysAgo) {
      priority += 30;
    }

    // Few applications = slight priority
    if (lesson.applications < 5) {
      priority += 20 - lesson.applications;
    }

    // Recently added = boost
    const daysSinceAdded = Math.floor(
      (now.getTime() - new Date(lesson.added).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    if (daysSinceAdded < 7) {
      priority += 10 - daysSinceAdded;
    }

    return { lesson, priority };
  });

  // Sort by priority (descending) and return top N
  return scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((s) => s.lesson);
}

// Apply a lesson and log it
export function applyLesson(
  lessons: Lesson[],
  lessonId: string,
  context: string,
  success: boolean,
  notes?: string
): Lesson[] {
  return lessons.map((lesson) => {
    if (lesson.id === lessonId) {
      const newApplications = lesson.applications + 1;
      const newSuccessCount = success ? lesson.successCount + 1 : lesson.successCount;
      const newFailureCount = success ? lesson.failureCount : lesson.failureCount + 1;

      return {
        ...lesson,
        applications: newApplications,
        lastApplied: new Date().toISOString(),
        successCount: newSuccessCount,
        failureCount: newFailureCount,
        effectiveness: calculateEffectiveness(newSuccessCount, newApplications),
        applicationLog: [
          ...lesson.applicationLog,
          {
            timestamp: new Date().toISOString(),
            context,
            success,
            notes,
          },
        ],
      };
    }
    return lesson;
  });
}
