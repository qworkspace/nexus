"use client";

import { Card } from "@/components/ui/card";
import { Calendar, Clock, Tag } from "lucide-react";
import useSWR from "swr";

interface TimelineEvent {
  date: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags?: string[];
}

interface MemoryTimeline {
  events: TimelineEvent[];
  stats: {
    totalEvents: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

async function fetcher(url: string): Promise<MemoryTimeline> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function MemoryTimeline() {
  const { data, error } = useSWR<MemoryTimeline>(
    '/api/memory/timeline',
    fetcher,
    {
      refreshInterval: 120000, // 2-minute refresh
      revalidateOnFocus: false,
    }
  );

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {data && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-zinc-500">
              <Calendar className="inline h-4 w-4 mr-1" />
              {data?.stats?.totalEvents || 0} events
            </span>
            <span className="text-zinc-500">
              <Clock className="inline h-4 w-4 mr-1" />
              {formatDate(data?.stats?.dateRange?.start || '')} - {formatDate(data?.stats?.dateRange?.end || '')}
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {error && (
          <div className="text-center py-8 text-zinc-500">
            Failed to load timeline
          </div>
        )}

        {!data && !error && (
          <div className="text-center py-8 text-zinc-500">
            Loading timeline...
          </div>
        )}

        {(data?.events || []).map((event, index) => (
          <div key={`${event.date}-${index}`} className="relative">
            {/* Timeline Line */}
            {index !== (data?.events?.length || 0) - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-full bg-zinc-200" />
            )}

            {/* Event Card */}
            <Card className="ml-8 p-4">
              <div className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-500 flex items-center justify-center text-white text-sm font-medium">
                      {new Date(event.date).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {event.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatFullDate(event.date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {event.summary && (
                  <p className="text-sm text-zinc-700">
                    {event.summary}
                  </p>
                )}

                {/* Key Points */}
                {event.keyPoints.length > 0 && (
                  <div className="space-y-1">
                    {event.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-zinc-600"
                      >
                        <span className="text-zinc-400 mt-0.5">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
