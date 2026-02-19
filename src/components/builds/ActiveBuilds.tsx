'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DevSession } from '@/types/builds';
import { Loader2, Cpu, Clock } from 'lucide-react';

export function ActiveBuilds() {
  const [builds, setBuilds] = useState<DevSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuilds = async () => {
    try {
      const res = await fetch('/api/builds/active');
      if (res.ok) {
        const data = await res.json();
        setBuilds(data);
      }
    } catch (error) {
      console.error('Failed to fetch active builds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Active Builds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Active Builds
          {builds.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-zinc-100 text-zinc-700 rounded-full">
              {builds.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {builds.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active builds</p>
          </div>
        ) : (
          <div className="space-y-3">
            {builds.map((build) => (
              <div
                key={build.id}
                className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {build.task}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>Started {new Date(build.startTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
