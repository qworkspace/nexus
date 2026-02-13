'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompletedBuild } from '@/types/builds';
import { CheckCircle } from 'lucide-react';

interface BuildRating {
  commitHash: string;
  rating: number;
  commitMessage: string;
  timestamp: string;
}

export function CompletedBuilds() {
  const [builds, setBuilds] = useState<CompletedBuild[]>([]);
  const [ratings, setRatings] = useState<Map<string, number>>(new Map());
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
        const ratingsMap = new Map<string, number>();
        (data.ratings || []).forEach((r: BuildRating) => {
          ratingsMap.set(r.commitHash, r.rating);
        });
        setRatings(ratingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  };

  const submitRating = async (commitHash: string, rating: number, commitMessage: string) => {
    try {
      const res = await fetch('/api/builds/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitHash, rating, commitMessage }),
      });
      if (res.ok) {
        const newRatings = new Map(ratings);
        newRatings.set(commitHash, rating);
        setRatings(newRatings);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
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
          <span className="ml-2 text-xs text-zinc-500 font-normal">
            Last 10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {builds.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No completed builds yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {builds.map((build) => {
              const currentRating = ratings.get(build.hash);
              return (
                <div
                  key={build.hash}
                  className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {build.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
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
                    <div className="flex items-center gap-1 mt-2">
                      {currentRating === 3 ? (
                        <span className="text-sm">🔥</span>
                      ) : (
                        <button
                          onClick={() => submitRating(build.hash, 3, build.message)}
                          className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                          title="Great (3)"
                        >
                          🔥
                        </button>
                      )}
                      {currentRating === 2 ? (
                        <span className="text-sm">👍</span>
                      ) : (
                        <button
                          onClick={() => submitRating(build.hash, 2, build.message)}
                          className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                          title="Good (2)"
                        >
                          👍
                        </button>
                      )}
                      {currentRating === 1 ? (
                        <span className="text-sm">😐</span>
                      ) : (
                        <button
                          onClick={() => submitRating(build.hash, 1, build.message)}
                          className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                          title="Meh (1)"
                        >
                          😐
                        </button>
                      )}
                      {currentRating === 0 ? (
                        <span className="text-sm">👎</span>
                      ) : (
                        <button
                          onClick={() => submitRating(build.hash, 0, build.message)}
                          className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                          title="Bad (0)"
                        >
                          👎
                        </button>
                      )}
                      {currentRating !== undefined && (
                        <span className="text-xs text-zinc-400 ml-2">
                          ({currentRating})
                        </span>
                      )}
                    </div>
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
