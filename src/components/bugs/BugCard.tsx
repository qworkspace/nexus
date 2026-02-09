"use client";

import { Bug as BugType, Severity } from '@/lib/bugs';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  high: { bg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  low: { bg: 'bg-gray-500', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-700' },
};

const STATUS_COLORS: Record<string, string> = {
  'new': 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
  'investigating': 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
  'in-progress': 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
  'fixed': 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
  'wont-fix': 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-400',
  'cannot-reproduce': 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-400',
};

interface BugCardProps {
  bug: BugType;
  onClick?: () => void;
}

export function BugCard({ bug, onClick }: BugCardProps) {
  const severityStyle = SEVERITY_COLORS[bug.severity];
  const statusColor = STATUS_COLORS[bug.status] || STATUS_COLORS['new'];

  return (
    <Card
      className={`transition-all hover:shadow-md cursor-pointer ${severityStyle.border}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-3 h-3 rounded-full ${severityStyle.bg} flex-shrink-0`} />
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex-shrink-0">
              {bug.id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium flex-shrink-0">
              {bug.project}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${statusColor}`}>
            {bug.status.replace('-', ' ')}
          </span>
        </div>
        <CardTitle className="text-base mt-2 leading-tight">{bug.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">
          {bug.description}
        </p>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span className="capitalize">{bug.severity}</span>
          </div>
          <div className="flex items-center gap-2">
            {bug.assignedTo && (
              <span className="text-xs">
                <span className="text-zinc-400">Assigned to:</span> {bug.assignedTo}
              </span>
            )}
            <span className="text-zinc-400">
              {new Date(bug.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {bug.source && (
          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
              Source: {bug.source}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
