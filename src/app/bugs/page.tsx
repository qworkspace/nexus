"use client";

import { useState, useEffect } from 'react';
import { BugTrackerPanel } from '@/components/bugs/BugTrackerPanel';
import { Bug as BugType, BugStats as BugStatsType } from '@/lib/bugs';
import { CreateBugInput } from '@/lib/bugs/types';
import { Bug } from 'lucide-react';

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugType[]>([]);
  const [stats, setStats] = useState<BugStatsType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBugs = async () => {
    try {
      const response = await fetch('/api/bugs?limit=100');
      const data = await response.json();
      setBugs(data.bugs);
    } catch (error) {
      console.error('Failed to fetch bugs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/bugs/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateBug = async (bug: CreateBugInput) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bug),
      });

      if (!response.ok) {
        throw new Error('Failed to create bug');
      }

      await fetchBugs();
      await fetchStats();
    } catch (error) {
      console.error('Failed to create bug:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBugs(), fetchStats()]);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Bug className="h-12 w-12 mx-auto mb-4 animate-pulse text-foreground dark:text-muted-foreground" />
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Loading bugs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-foreground">
          Bug Tracker
        </h1>
        <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
          Track and manage bugs across all projects
        </p>
      </div>

      <BugTrackerPanel
        bugs={bugs}
        stats={stats || undefined}
        onCreateBug={handleCreateBug}
        isCreating={isCreating}
      />
    </div>
  );
}
