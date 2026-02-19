"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bug, Search, AlertCircle } from "lucide-react";
import {
  Bug as BugType,
  BugStatus,
  BugPriority,
} from "@/lib/bugs/BugService";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { BugDetail } from "./BugDetail";

interface BugListProps {
  onBugClick?: (bug: BugType) => void;
}

interface BugsResponse {
  success: boolean;
  data: BugType[];
  count: number;
}

async function fetcher(url: string): Promise<BugsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const PRIORITY_COLORS: Record<BugPriority, string> = {
  critical: "bg-red-500",
  high: "bg-[#FFE135]",
  medium: "bg-yellow-500",
  low: "bg-zinc-800",
};

const STATUS_COLORS: Record<BugStatus, string> = {
  open: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  "in-progress": "bg-zinc-100 dark:bg-blue-950 text-zinc-700 dark:text-zinc-500",
  testing: "bg-zinc-100 dark:bg-purple-950 text-zinc-700 dark:text-zinc-500",
  resolved: "bg-zinc-100 dark:bg-green-950 text-zinc-700 dark:text-zinc-500",
  closed: "bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-400",
};

const formatRelativeTime = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

export function BugList({ onBugClick }: BugListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<BugPriority | 'all'>('all');
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);

  // Build query params
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set('search', searchQuery);
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (priorityFilter !== 'all') queryParams.set('priority', priorityFilter);

  const { data, error, isLoading } = useSWR<BugsResponse>(
    `/api/bugs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  const bugs = data?.data || [];

  const handleBugClick = (bug: BugType) => {
    setSelectedBug(bug);
    onBugClick?.(bug);
  };

  const handleUpdateBug = async (id: string, updates: Partial<BugType>, changedBy: string) => {
    try {
      const response = await fetch(`/api/bugs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, changedBy }),
      });

      if (response.ok) {
        mutate(`/api/bugs?${queryParams.toString()}`);
        if (selectedBug?.id === id) {
          setSelectedBug(null); // Close detail to reload
        }
      }
    } catch (error) {
      console.error('Failed to update bug:', error);
    }
  };

  const handleAddComment = async (id: string, author: string, content: string) => {
    try {
      const response = await fetch(`/api/bugs/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content }),
      });

      if (response.ok) {
        mutate(`/api/bugs?${queryParams.toString()}`);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <>
      {selectedBug ? (
        <BugDetail
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdate={handleUpdateBug}
          onAddComment={handleAddComment}
        />
      ) : (
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bug className="h-5 w-5" />
              BUG LIST
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search bugs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'all')}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="testing">Testing</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as BugPriority | 'all')}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Bug List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-sm text-zinc-500">
                  Loading bugs...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-sm text-red-500">
                  Error loading bugs
                </div>
              ) : bugs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm">No bugs found</p>
                  <p className="text-xs mt-1">Create a new bug to get started</p>
                </div>
              ) : (
                bugs.map((bug) => (
                  <button
                    key={bug.id}
                    onClick={() => handleBugClick(bug)}
                    className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`flex-1 min-w-0`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[bug.priority]}`} />
                          <span className="text-xs font-mono text-zinc-500">{bug.id}</span>
                        </div>
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {bug.title}
                        </h4>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[bug.status]}`}>
                        {bug.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                      {bug.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="capitalize">{bug.category}</span>
                      <span>{formatRelativeTime(bug.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Count */}
            {bugs.length > 0 && (
              <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-xs text-zinc-500">
                  Showing {bugs.length} bug{bugs.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
