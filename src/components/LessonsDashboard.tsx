"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import useSWR from "swr";
import type { Lesson } from "@/lib/lessons-parser";

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

type FilterType = "all" | "recent" | "needs-review" | "most-applied";

export function LessonsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { data, error, mutate } = useSWR<LessonsResponse>(
    "/api/lessons",
    fetcher,
    {
      refreshInterval: 300000, // 5-minute refresh
      revalidateOnFocus: false,
    }
  );

  const lessons = data?.lessons || [];
  const topLessons = data?.topLessons || [];

  // Get unique categories
  const categories = Array.from(
    new Set(lessons.map((l) => l.category))
  ).sort();

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      lesson.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || lesson.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Apply additional filters
  let displayLessons = filteredLessons;

  if (filterType === "recent") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    displayLessons = filteredLessons.filter(
      (l) => new Date(l.added) >= sevenDaysAgo
    );
  } else if (filterType === "needs-review") {
    displayLessons = filteredLessons.filter(
      (l) => l.effectiveness !== null && l.effectiveness < 80
    );
  } else if (filterType === "most-applied") {
    displayLessons = [...filteredLessons]
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
  }

  // Stats
  const stats = {
    total: lessons.length,
    appliedToday: lessons.filter((l) => {
      if (!l.lastApplied) return false;
      const lastApplied = new Date(l.lastApplied);
      const today = new Date();
      return (
        lastApplied.getDate() === today.getDate() &&
        lastApplied.getMonth() === today.getMonth() &&
        lastApplied.getFullYear() === today.getFullYear()
      );
    }).length,
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

  const getEffectivenessColor = (effectiveness: number | null) => {
    if (effectiveness === null) return "text-zinc-500";
    if (effectiveness >= 90) return "text-green-600";
    if (effectiveness >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, { count: number; effectiveness: number }> = {};

    lessons.forEach((lesson) => {
      if (!breakdown[lesson.category]) {
        breakdown[lesson.category] = { count: 0, effectiveness: 0 };
      }
      breakdown[lesson.category].count++;
      if (lesson.effectiveness !== null) {
        breakdown[lesson.category].effectiveness += lesson.effectiveness;
      }
    });

    // Calculate averages
    Object.keys(breakdown).forEach((cat) => {
      const lessonsInCategory = lessons.filter((l) => l.category === cat);
      const lessonsWithEffectiveness = lessonsInCategory.filter(
        (l) => l.effectiveness !== null
      );
      if (lessonsWithEffectiveness.length > 0) {
        breakdown[cat].effectiveness = Math.round(
          breakdown[cat].effectiveness / lessonsWithEffectiveness.length
        );
      }
    });

    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              LESSONS OVERVIEW
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => mutate()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Total Lessons
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {stats.total}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Applied Today
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {stats.appliedToday}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Avg Effectiveness
              </p>
              <p className={`text-2xl font-semibold ${getEffectivenessColor(stats.avgEffectiveness)}`}>
                {stats.avgEffectiveness}%
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Needs Review
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.needsReview}
              </p>
            </div>
          </div>

          {/* Session Start Reminder */}
          {topLessons.length > 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Top Lessons to Review (Session Start)
              </h3>
              <div className="space-y-2">
                {topLessons.map((lesson, i) => (
                  <div
                    key={lesson.id}
                    className="text-sm text-blue-800 dark:text-blue-200"
                  >
                    <span className="font-medium">{i + 1}.</span> [
                    {lesson.category}] {lesson.pattern} →{" "}
                    {lesson.rule.substring(0, 60)}
                    {lesson.rule.length > 60 && "..."}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown).map(([category, data]) => {
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {category} ({data.count})
                    </span>
                    <span
                      className={`text-xs font-medium ${getEffectivenessColor(data.effectiveness)}`}
                    >
                      {data.effectiveness || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        data.effectiveness >= 90
                          ? "bg-green-500"
                          : data.effectiveness >= 80
                          ? "bg-yellow-500"
                          : data.effectiveness > 0
                          ? "bg-red-500"
                          : "bg-zinc-400"
                      }`}
                      style={{ width: `${data.effectiveness || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Lessons</span>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("recent")}
              >
                Recent
              </Button>
              <Button
                variant={filterType === "needs-review" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("needs-review")}
              >
                Needs Review
              </Button>
              <Button
                variant={filterType === "most-applied" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("most-applied")}
              >
                Most Applied
              </Button>
            </div>
          </CardTitle>

          {/* Search and Filter */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-transparent text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              Failed to load lessons
            </div>
          )}

          <div className="space-y-2">
            {displayLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{lesson.category}</Badge>
                      {lesson.effectiveness !== null && (
                        <Badge
                          variant={
                            lesson.effectiveness >= 90
                              ? "default"
                              : lesson.effectiveness >= 80
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {lesson.effectiveness}%
                        </Badge>
                      )}
                      {lesson.applications === 0 && (
                        <Badge variant="outline" className="text-zinc-500">
                          New
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {lesson.pattern}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {lesson.rule}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right ml-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(lesson.lastApplied)}
                    </div>
                    <div className="mt-1">
                      {lesson.applications}× applied
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {displayLessons.length === 0 && (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No lessons found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLesson(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {selectedLesson.category}
                  </CardTitle>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {selectedLesson.pattern}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLesson(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Rule */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Rule
                </h3>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {selectedLesson.rule}
                  </p>
                </div>
                {selectedLesson.fix && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      Fix
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                      {selectedLesson.fix}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Applications
                  </p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLesson.applications}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Success Rate
                  </p>
                  <p
                    className={`text-xl font-semibold ${getEffectivenessColor(selectedLesson.effectiveness)}`}
                  >
                    {selectedLesson.effectiveness || 0}%
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Added
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDate(selectedLesson.added)}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Last Applied
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatRelativeTime(selectedLesson.lastApplied)}
                  </p>
                </div>
              </div>

              {/* Applications Log */}
              {selectedLesson.applicationLog.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Applications Log
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedLesson.applicationLog.map((log, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3"
                      >
                        <div className="mt-0.5">
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-zinc-700 dark:text-zinc-300">
                              {log.context}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatRelativeTime(log.timestamp)}
                            </p>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
