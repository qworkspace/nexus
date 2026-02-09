'use client';

import { Bug, BugStats as Stats } from '@/lib/bugs/types';
import { AlertTriangle, CheckCircle2, Clock, Bug as BugIcon } from 'lucide-react';

interface BugStatsProps {
  stats: Stats;
}

export function BugStats({ stats }: BugStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Open Bugs"
        value={stats.open}
        icon={BugIcon}
        variant="default"
      />
      <StatCard
        label="Critical"
        value={stats.critical}
        icon={AlertTriangle}
        variant="danger"
      />
      <StatCard
        label="High Priority"
        value={stats.high}
        icon={Clock}
        variant="warning"
      />
      <StatCard
        label="Fixed This Week"
        value={stats.fixedThisWeek}
        icon={CheckCircle2}
        variant="success"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'danger' | 'warning' | 'success';
}

function StatCard({ label, value, icon: Icon, variant }: StatCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 text-gray-900 border-gray-200',
    danger: 'bg-red-50 text-red-900 border-red-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    success: 'bg-green-50 text-green-900 border-green-200'
  };

  const iconStyles = {
    default: 'text-gray-600',
    danger: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-green-600'
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconStyles[variant]}`} />
      </div>
    </div>
  );
}
