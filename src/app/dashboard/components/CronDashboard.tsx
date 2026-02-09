"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, Filter } from "lucide-react";
import useSWR from "swr";
import { CronJobCard, type CronJob } from "./CronJobCard";
import { CronHistory } from "./CronHistory";

interface CronListResponse {
  source: 'live' | 'mock' | 'error';
  jobs: CronJob[];
  error?: string;
}

async function fetcher(url: string): Promise<CronListResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

type FilterType = 'all' | 'enabled' | 'disabled' | 'failed';

export function CronDashboard() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const { data, isLoading, mutate } = useSWR<CronListResponse>(
    '/api/crons/list',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  const jobs = data?.jobs || [];

  const filteredJobs = jobs.filter((job) => {
    switch (filter) {
      case 'enabled':
        return job.enabled;
      case 'disabled':
        return !job.enabled;
      case 'failed':
        return job.state.lastStatus === 'error';
      default:
        return true;
    }
  });

  const enabledJobs = jobs.filter(j => j.enabled).length;
  const failedJobs = jobs.filter(j => j.state.lastStatus === 'error').length;
  const totalRuns = jobs.filter(j => j.state.lastRunAtMs).length;

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/crons/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      const command = id;
      const result = await fetch('/api/openclaw/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `openclaw cron run ${command}`,
        }),
      });

      if (result.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

  const handleViewHistory = (id: string) => {
    setSelectedJobId(id);
  };

  const handleCloseHistory = () => {
    setSelectedJobId(null);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">
              CRON JOBS
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-1">
              {enabledJobs} enabled · {failedJobs} failures · {totalRuns} total runs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/crons'}
              className="text-xs"
            >
              Full Dashboard
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-zinc-500" />
            <div className="flex gap-1">
              {(['all', 'enabled', 'disabled', 'failed'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'failed' && failedJobs > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {failedJobs}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-zinc-500">
                Loading cron jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-500">
                No cron jobs found
              </div>
            ) : (
              filteredJobs.map((job) => (
                <CronJobCard
                  key={job.id}
                  job={job}
                  onToggle={handleToggle}
                  onRunNow={handleRunNow}
                  onViewHistory={handleViewHistory}
                  showHistory={true}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Panel */}
      {selectedJob && (
        <CronHistory
          jobId={selectedJob.id}
          jobName={selectedJob.name}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
}
