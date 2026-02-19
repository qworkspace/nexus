'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompletedBuild } from '@/types/builds';
import { CheckCircle } from 'lucide-react';

interface FeedbackRating {
  commit: string;
  spec: string;
  rating: 'great' | 'good' | 'meh' | 'bad' | 'useless';
  ratedBy: string;
  ratedAt: string;
  issues: string[];
  context?: string;
}

export function CompletedBuilds() {
  const [builds, setBuilds] = useState<CompletedBuild[]>([]);
  const [feedback, setFeedback] = useState<Map<string, FeedbackRating>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchBuilds = async () => {
    try {
      const res = await fetch('/api/builds?limit=20');
      if (res.ok) {
        const data = await res.json();
        setBuilds(data);
      }
    } catch (error) {
      console.error('Failed to fetch completed builds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
    fetchRatings();
    const interval = setInterval(fetchBuilds, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch('/api/builds/ratings');
      if (res.ok) {
        const data = await res.json();
        const feedbackMap = new Map<string, FeedbackRating>();
        (data.feedback || []).forEach((f: FeedbackRating) => {
          feedbackMap.set(f.commit, f);
        });
        setFeedback(feedbackMap);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'great': return '⭐';
      case 'good': return '👍';
      case 'meh': return '😐';
      case 'bad': return '👎';
      case 'useless': return '🗑';
      default: return '❓';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'great':
      case 'good': return 'text-green-600 bg-green-50';
      case 'meh': return 'text-yellow-600 bg-yellow-50';
      case 'bad':
      case 'useless': return 'text-red-600 bg-red-50';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Builds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Completed Builds
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            Last 10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {builds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No completed builds yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {builds.map((build) => {
              const feedbackForBuild = feedback.get(build.hash);
              return (
                <div
                  key={build.hash}
                  className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-card rounded-lg group hover:bg-zinc-100 dark:hover:bg-secondary transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-foreground line-clamp-2">
                      {build.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{build.hash}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(build.timestamp)}</span>
                      <span>•</span>
                      <span>+{build.linesAdded} / -{build.linesRemoved}</span>
                    </div>
                    {build.specName && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                          → {build.specName}
                        </span>
                      </div>
                    )}
                    
                    {/* Feedback display from PJ ratings */}
                    {feedbackForBuild ? (
                      <div className="mt-2">
                        <div className={`px-2 py-1 rounded text-xs ${getRatingColor(feedbackForBuild.rating)}`}>
                          <span className="font-medium">
                            {getRatingEmoji(feedbackForBuild.rating)} {feedbackForBuild.rating.toUpperCase()}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            by {feedbackForBuild.ratedBy} • {formatRelativeTime(feedbackForBuild.ratedAt)}
                          </span>
                          {feedbackForBuild.issues.length > 0 && (
                            <div className="mt-1 text-red-600">
                              Issues: {feedbackForBuild.issues.join(', ')}
                            </div>
                          )}
                        </div>
                        {/* Link to Fix Log for bad/useless ratings */}
                        {(feedbackForBuild.rating === 'bad' || feedbackForBuild.rating === 'useless') && (
                          <button
                            onClick={() => {
                              // Dispatch custom event to switch to fix-log tab and filter
                              window.dispatchEvent(new CustomEvent('navigate-to-fix-log', {
                                detail: { spec: feedbackForBuild.spec }
                              }));
                            }}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            → View in Fix Log
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        ⏳ Awaiting review
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
