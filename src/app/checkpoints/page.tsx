'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CheckpointData, CheckpointFile } from '@/types/checkpoints';
import { RefreshCw, Clock, AlertTriangle, FileText, Trash2, Eye, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function CheckpointsPage() {
  const [data, setData] = useState<CheckpointData | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointFile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchCheckpoints = useCallback(async () => {
    try {
      const url = selectedDate
        ? `/api/checkpoints?date=${selectedDate}`
        : '/api/checkpoints';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const checkpointData = await res.json();
        setData(checkpointData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch checkpoints:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchCheckpointDetail = async (checkpoint: CheckpointFile) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/checkpoints?id=${checkpoint.filename}`, { cache: 'no-store' });
      if (res.ok) {
        const detail = await res.json();
        setSelectedCheckpoint(detail.checkpoint);
      }
    } catch (error) {
      console.error('Failed to fetch checkpoint detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const deleteCheckpoint = async (checkpoint: CheckpointFile) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/checkpoints/delete?id=${checkpoint.filename}&date=${checkpoint.dateDir}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedCheckpoint(null);
        fetchCheckpoints();
      } else {
        const error = await res.json();
        alert(`Failed to delete checkpoint: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete checkpoint:', error);
      alert('Failed to delete checkpoint');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const formatError = (error: string) => {
    if (!error || error === 'NO_ERROR') return 'No error';
    if (error.length > 80) return error.substring(0, 80) + '...';
    return error;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-muted-foreground bg-zinc-50 border-zinc-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">📋 Agent Checkpoints</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Session checkpoints for debugging failed builds
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span>Auto-refreshes on date change</span>
            </div>
            <button
              onClick={fetchCheckpoints}
              className="px-3 py-1.5 text-sm bg-card text-foreground rounded-md hover:bg-secondary transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading checkpoints...</span>
          </div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Date filter and checkpoint list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="date-filter" className="text-sm font-medium text-zinc-700">
                    Filter by date:
                  </label>
                  <select
                    id="date-filter"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="">All dates ({data.totalCount} checkpoints)</option>
                    {data.dates.map((date) => (
                      <option key={date} value={date}>
                        {date} ({data.groupByDate[date]?.length || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Checkpoints List */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                  Checkpoints ({data.checkpoints.length})
                </h2>

                {data.checkpoints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No checkpoints found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.checkpoints.map((checkpoint) => (
                      <div
                        key={checkpoint.filename}
                        onClick={() => fetchCheckpointDetail(checkpoint)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                          selectedCheckpoint?.filename === checkpoint.filename
                            ? 'bg-zinc-100 dark:bg-secondary border-zinc-400'
                            : 'bg-zinc-50 dark:bg-card border-zinc-200 dark:border-border hover:bg-zinc-100 dark:hover:bg-secondary'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertTriangle className={cn('h-4 w-4', getStatusColor(checkpoint.status).split(' ')[0])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded border',
                              getStatusColor(checkpoint.status)
                            )}>
                              {checkpoint.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {checkpoint.agentType}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-foreground truncate">
                            {checkpoint.sessionKey}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {formatError(checkpoint.error)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(checkpoint.timestamp)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCheckpointDetail(checkpoint);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Checkpoint details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                  Checkpoint Details
                </h2>

                {loadingDetail ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </div>
                ) : selectedCheckpoint ? (
                  <div className="space-y-4">
                    {/* Session Info */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Session Info
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Session Key:</span>
                          <p className="font-medium text-zinc-900 break-all">
                            {selectedCheckpoint.sessionKey}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Agent Type:</span>
                          <p className="font-medium text-zinc-900">
                            {selectedCheckpoint.agentType}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timestamp:</span>
                          <p className="text-zinc-900">{formatDate(selectedCheckpoint.timestamp)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className={cn(
                            'ml-2 px-2 py-0.5 text-xs font-medium rounded border',
                            getStatusColor(selectedCheckpoint.status)
                          )}>
                            {selectedCheckpoint.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Error Details */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Error Details
                      </h3>
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                        <p className="text-sm text-red-900 dark:text-red-100 break-all">
                          {selectedCheckpoint.error || 'No error'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Actions
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => window.open(`/api/checkpoints?id=${selectedCheckpoint.filename}`, '_blank')}
                          className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-secondary text-zinc-900 dark:text-foreground rounded-md hover:bg-zinc-200 dark:hover:bg-muted transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Full Checkpoint
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete checkpoint ${selectedCheckpoint.filename}?`)) {
                              deleteCheckpoint(selectedCheckpoint);
                            }
                          }}
                          disabled={deleting}
                          className="w-full px-3 py-2 text-sm bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-900 rounded-md hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {deleting ? 'Deleting...' : 'Delete Checkpoint'}
                        </button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        File Info
                      </h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Filename: {selectedCheckpoint.filename}</p>
                        <p>Date: {selectedCheckpoint.dateDir}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Select a checkpoint to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Failed to load checkpoints</p>
        </div>
      )}

      {/* Last updated */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
