"use client";

import { Bug as BugType, Severity } from '@/lib/bugs';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-[#3D3D3D]', text: 'text-white', border: 'border-[#3D3D3D]/30' },
  high: { bg: 'bg-[#8E99A4]', text: 'text-white', border: 'border-[#8E99A4]/30' },
  medium: { bg: 'bg-[#D4C5A9]', text: 'text-[#3D3D3D]', border: 'border-[#D4C5A9]/30' },
  low: { bg: 'bg-zinc-300', text: 'text-zinc-600', border: 'border-zinc-200' },
};

const STATUS_COLORS: Record<string, string> = {
  'new': 'bg-zinc-100 text-zinc-700',
  'investigating': 'bg-zinc-100 text-zinc-700',
  'in-progress': 'bg-zinc-100 text-zinc-700',
  'fixed': 'bg-zinc-100 text-zinc-700',
  'wont-fix': 'bg-gray-100 text-gray-700',
  'cannot-reproduce': 'bg-gray-100 text-gray-700',
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
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              {bug.id}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium flex-shrink-0">
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
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {bug.description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span className="capitalize">{bug.severity}</span>
          </div>
          <div className="flex items-center gap-2">
            {bug.assignedTo && (
              <span className="text-xs">
                <span className="text-muted-foreground">Assigned to:</span> {bug.assignedTo}
              </span>
            )}
            <span className="text-muted-foreground">
              {new Date(bug.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {bug.source && (
          <div className="mt-2 pt-2 border-t border-zinc-200">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Source: {bug.source}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
