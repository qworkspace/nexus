'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueuedSpec } from '@/types/builds';
import { ListTodo, Clock, AlertTriangle } from 'lucide-react';

export function BuildQueue() {
  const [queue, setQueue] = useState<QueuedSpec[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/builds/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (error) {
      console.error('Failed to fetch build queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'P1':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'P2':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'P0':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Build Queue
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
          <ListTodo className="h-4 w-4" />
          Build Queue
          {queue.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {queue.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Queue is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((spec) => (
              <div
                key={spec.id}
                className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(spec.priority)}`}
                  >
                    {getPriorityIcon(spec.priority)}
                    {spec.priority}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {spec.title}
                  </p>
                  {spec.estTime && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>{spec.estTime}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
