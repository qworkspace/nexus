'use client';

import { BugFilters as Filters, Project, Severity, BugStatus } from '@/lib/bugs/types';

interface BugFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function BugFilters({ filters, onChange }: BugFiltersProps) {
  return (
    <div className="flex gap-3 mb-4">
      <select
        value={filters.project || ''}
        onChange={(e) => onChange({ ...filters, project: e.target.value as Project || undefined })}
        className="px-3 py-2 border rounded-lg text-sm bg-white"
      >
        <option value="">All Projects</option>
        <option value="cryptomon">Cryptomon</option>
        <option value="mission-control">Mission Control</option>
        <option value="content-pipeline">Content Pipeline</option>
        <option value="cohera">Cohera</option>
        <option value="q-system">Q System</option>
      </select>

      <select
        value={filters.severity || ''}
        onChange={(e) => onChange({ ...filters, severity: e.target.value as Severity || undefined })}
        className="px-3 py-2 border rounded-lg text-sm bg-white"
      >
        <option value="">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value as BugStatus || undefined })}
        className="px-3 py-2 border rounded-lg text-sm bg-white"
      >
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="investigating">Investigating</option>
        <option value="in-progress">In Progress</option>
        <option value="fixed">Fixed</option>
        <option value="wont-fix">Won't Fix</option>
        <option value="cannot-reproduce">Cannot Reproduce</option>
      </select>
    </div>
  );
}
