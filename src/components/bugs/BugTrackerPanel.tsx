"use client";

import { useState, useMemo } from 'react';
import { Bug as BugType, Project, Severity, BugStatus, BugSource, BugStats as BugStatsType } from '@/lib/bugs';
import { BugCard } from './BugCard';
import { BugStats } from './BugStats';
import { CreateBugDialog } from './CreateBugDialog';
import { Bug, Search, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateBugInput } from '@/lib/bugs/types';

interface BugTrackerPanelProps {
  bugs: BugType[];
  stats?: BugStatsType;
  onCreateBug?: (bug: CreateBugInput) => Promise<void>;
  isCreating?: boolean;
}

export function BugTrackerPanel({ bugs, stats, onCreateBug, isCreating = false }: BugTrackerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<Project | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<BugSource | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredBugs = useMemo(() => {
    return bugs.filter(bug => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          bug.title.toLowerCase().includes(query) ||
          bug.description.toLowerCase().includes(query) ||
          bug.id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Project filter
      if (projectFilter !== 'all' && bug.project !== projectFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && bug.severity !== severityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && bug.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'all' && bug.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [bugs, searchQuery, projectFilter, severityFilter, statusFilter, sourceFilter]);

  const projects: Project[] = ['cryptomon', 'mission-control', 'content-pipeline', 'cohera', 'q-system'];
  const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
  const statuses: BugStatus[] = ['new', 'investigating', 'in-progress', 'fixed', 'wont-fix', 'cannot-reproduce'];
  const sources: BugSource[] = ['testing', 'manual', 'build', 'console', 'user'];

  const SEVERITY_COLORS: Record<Severity, string> = {
    critical: 'bg-zinc-500',
    high: 'bg-zinc-500',
    medium: 'bg-zinc-500',
    low: 'bg-gray-500',
  };

  const handleCreateBug = async (bug: CreateBugInput) => {
    await onCreateBug?.(bug);
    setCreateDialogOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setProjectFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
  };

  const hasActiveFilters = searchQuery || projectFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Stats Card + Filters (when stats provided) */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-foreground mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bugs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Filters Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                        Project
                      </label>
                      <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value as Project | 'all')}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                      >
                        <option value="all">All Projects</option>
                        {projects.map(project => (
                          <option key={project} value={project}>
                            {project.charAt(0).toUpperCase() + project.slice(1).replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                        Severity
                      </label>
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                      >
                        <option value="all">All Severities</option>
                        {severities.map(severity => (
                          <option key={severity} value={severity}>
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'all')}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                      >
                        <option value="all">All Statuses</option>
                        {statuses.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                        Source
                      </label>
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as BugSource | 'all')}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                      >
                        <option value="all">All Sources</option>
                        {sources.map(source => (
                          <option key={source} value={source}>
                            {source.charAt(0).toUpperCase() + source.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <BugStats stats={stats} />
          </div>
        </div>
      )}

      {/* Filters Section (when no stats provided) */}
      {!stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-foreground mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bugs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                    Project
                  </label>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value as Project | 'all')}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project} value={project}>
                        {project.charAt(0).toUpperCase() + project.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                    Severity
                  </label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="all">All Severities</option>
                    {severities.map(severity => (
                      <option key={severity} value={severity}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'all')}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-foreground mb-1">
                    Source
                  </label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as BugSource | 'all')}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-background text-zinc-900 dark:text-foreground focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="all">All Sources</option>
                    {sources.map(source => (
                      <option key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
            <span className="text-sm font-medium text-zinc-700 dark:text-foreground">
              {filteredBugs.length} Bug{filteredBugs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-zinc-900 dark:text-foreground hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {onCreateBug && (
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Bug
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Severity:</span>
            {severities.map(severity => (
              <div
                key={severity}
                className="flex items-center gap-1"
                title={severity.charAt(0).toUpperCase() + severity.slice(1)}
              >
                <div className={`w-3 h-3 rounded-full ${SEVERITY_COLORS[severity]}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bugs Grid */}
      {filteredBugs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bug className="h-12 w-12 mx-auto mb-4 text-foreground dark:text-muted-foreground" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                No bugs found matching your filters
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-sm text-zinc-900 dark:text-foreground hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              onClick={() => {
                // Future: open bug detail modal
                console.log('Bug clicked:', bug.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Create Bug Dialog */}
      <CreateBugDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateBug={handleCreateBug}
        isCreating={isCreating}
      />
    </div>
  );
}
