"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface Lesson {
  title: string;
  category: string;
  date: string;
}

interface LessonsCardProps {
  lessons: {
    total: number;
    recent: Lesson[];
  };
}

export function LessonsCard({ lessons }: LessonsCardProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={18} />
          Recent Lessons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.recent.length > 0 ? (
          <div className="space-y-3">
            {lessons.recent.map((lesson, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="text-sm font-medium text-zinc-900 mb-1">
                  {lesson.title}
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="px-2 py-0.5 bg-zinc-200 rounded text-zinc-700">
                    {lesson.category}
                  </span>
                  <span>{formatDate(lesson.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-zinc-400 py-8">
            No lessons recorded yet
          </div>
        )}
        {lessons.total > lessons.recent.length && (
          <div className="mt-4 text-center">
            <span className="text-sm text-zinc-500">
              View all {lessons.total} lessons in LESSONS.md
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
