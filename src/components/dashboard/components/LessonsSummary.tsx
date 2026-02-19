"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import useSWR from "swr";
import type { Lesson } from "@/lib/lessons-parser";
import { useRouter } from "next/navigation";

interface LessonsResponse {
  lessons: Lesson[];
  topLessons: Lesson[];
  lastUpdated: string;
}

async function fetcher(url: string): Promise<LessonsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function LessonsSummary() {
  const router = useRouter();
  const { data, error } = useSWR<LessonsResponse>("/api/lessons", fetcher, {
    refreshInterval: 300000, // 5-minute refresh
    revalidateOnFocus: false,
  });

  const lessons = data?.lessons || [];
  const topLessons = data?.topLessons || [];

  // Stats
  const stats = {
    total: lessons.length,
    needsReview: lessons.filter(
      (l) => l.effectiveness !== null && l.effectiveness < 80
    ).length,
    avgEffectiveness:
      lessons.filter((l) => l.effectiveness !== null).length > 0
        ? Math.round(
            lessons
              .filter((l) => l.effectiveness !== null)
              .reduce((sum, l) => sum + (l.effectiveness || 0), 0) /
              lessons.filter((l) => l.effectiveness !== null).length
          )
        : 0,
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 90) return "text-zinc-600";
    if (effectiveness >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (error) {
    return (
      <Card className="col-span-12 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            LESSONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500 text-sm">
            Failed to load lessons
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-12 lg:col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            LESSONS
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/lessons")}
            className="h-8"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.total}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total
            </p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-semibold ${getEffectivenessColor(stats.avgEffectiveness)}`}>
              {stats.avgEffectiveness}%
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Success
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600">
              {stats.needsReview}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Review
            </p>
          </div>
        </div>

        {/* Top Lessons */}
        {topLessons.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Priority Review
            </h3>
            <div className="space-y-2">
              {topLessons.slice(0, 3).map((lesson) => (
                <div
                  key={lesson.id}
                  className="text-xs bg-zinc-50 dark:bg-zinc-900 rounded p-2"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {lesson.category}
                    </span>
                    {lesson.effectiveness !== null && (
                      <span
                        className={`text-[10px] ${getEffectivenessColor(lesson.effectiveness)}`}
                      >
                        ({lesson.effectiveness}%)
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {lesson.pattern}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Review Alert */}
        {stats.needsReview > 0 && (
          <div className="mt-4 flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
            <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {stats.needsReview} lesson{stats.needsReview > 1 ? "s" : ""} need review
              </p>
              <p className="text-red-700 dark:text-red-300">
                Effectiveness below 80%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
