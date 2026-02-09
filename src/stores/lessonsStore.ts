import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson } from '@/lib/lessons-parser';

interface LessonsState {
  lessons: Lesson[];
  lastUpdated: string | null;
  isLoaded: boolean;
  error: string | null;

  // Actions
  setLessons: (lessons: Lesson[]) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  applyLesson: (id: string, context: string, success: boolean, notes?: string) => void;
  reset: () => void;
  setError: (error: string | null) => void;
}

export const useLessonsStore = create<LessonsState>()(
  persist(
    (set) => ({
      lessons: [],
      lastUpdated: null,
      isLoaded: false,
      error: null,

      setLessons: (lessons) =>
        set({
          lessons,
          lastUpdated: new Date().toISOString(),
          isLoaded: true,
          error: null,
        }),

      addLesson: (lesson) =>
        set((state) => ({
          lessons: [...state.lessons, lesson],
          lastUpdated: new Date().toISOString(),
        })),

      updateLesson: (id, updates) =>
        set((state) => ({
          lessons: state.lessons.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
          lastUpdated: new Date().toISOString(),
        })),

      applyLesson: (id, context, success, notes) =>
        set((state) => {
          const lessons = state.lessons.map((lesson) => {
            if (lesson.id === id) {
              const newApplications = lesson.applications + 1;
              const newSuccessCount = success
                ? lesson.successCount + 1
                : lesson.successCount;
              const newFailureCount = success
                ? lesson.failureCount
                : lesson.failureCount + 1;
              const newEffectiveness =
                newApplications > 0
                  ? Math.round((newSuccessCount / newApplications) * 100)
                  : null;

              return {
                ...lesson,
                applications: newApplications,
                lastApplied: new Date().toISOString(),
                successCount: newSuccessCount,
                failureCount: newFailureCount,
                effectiveness: newEffectiveness,
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

          return { lessons, lastUpdated: new Date().toISOString() };
        }),

      reset: () =>
        set({
          lessons: [],
          lastUpdated: null,
          isLoaded: false,
          error: null,
        }),

      setError: (error) => set({ error, isLoaded: true }),
    }),
    {
      name: 'lessons-storage',
      partialize: (state) => ({
        lessons: state.lessons,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

// Selectors
export const selectLessonsByCategory = (category: string) => (state: LessonsState) =>
  state.lessons.filter((l) => l.category === category);

export const selectLessonsNeedingReview = (state: LessonsState) =>
  state.lessons.filter((l) => l.effectiveness !== null && l.effectiveness < 80);

export const selectMostAppliedLessons = (limit: number) => (state: LessonsState) =>
  [...state.lessons]
    .sort((a, b) => b.applications - a.applications)
    .slice(0, limit);

export const selectRecentlyAddedLessons = (days: number) => (state: LessonsState) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return state.lessons.filter((l) => new Date(l.added) >= cutoff);
};
