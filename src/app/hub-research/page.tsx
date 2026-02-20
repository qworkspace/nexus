"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RefreshCw, Clock, CheckCircle, XCircle, PauseCircle,
  Plus, Rocket, Download,
  BarChart3, Zap, Pencil, RotateCcw
} from "lucide-react";

// ── Types ──

interface PipelineItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  impact: string;
  description: string;
  source: 'research' | 'deep-focus' | 'innovation-think' | 'retro' | 'pj-request' | 'manual';
  sourceRef: string | null;
  status: 'pending-review' | 'queued' | 'speccing' | 'building' | 'qa' | 'shipped' | 'rejected' | 'parked';
  priority: 'HIGH' | 'MED' | 'LOW';
  complexity: 'HIGH' | 'MED' | 'LOW';
  createdAt: string;
  approvedAt: string;
  shippedAt?: string;
  assignee: string;
  specPath?: string;
  buildCommit?: string;
  feedback?: {
    rating: 'nailed-it' | 'acceptable' | 'needs-work' | 'good' | 'bad' | 'comment'; // include legacy for compat
    tags?: string[];
    comment?: string;
    rolledBack?: boolean;
    ratedAt: string;
  };
  qReview?: {
    complexityAssessed: 'HIGH' | 'MED' | 'LOW';
    complexityChanged?: boolean;
    missingInfo?: string[];
    riskSummary?: string;
    recommendation: 'approve' | 'park' | 'reject' | 'needs-info';
    recommendationReason?: string;
  };
}

// ── Helpers ──

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  'research':        { label: 'Research',        className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
  'deep-focus':      { label: 'Deep Focus',      className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
  'innovation-think':{ label: 'Innovation Think', className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
  'retro':           { label: 'Retro',            className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
  'pj-request':      { label: 'PJ Request',       className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
  'manual':          { label: 'Manual',           className: 'bg-zinc-100 text-zinc-700 border border-zinc-200' },
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-[#F5D547] text-zinc-900 border-[#F5D547]',
  MED:  'bg-[#8E99A4]/20 text-[#555D66] border-[#8E99A4]/30',
  LOW:  'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const PIPELINE_STAGES = ['queued', 'speccing', 'building', 'qa'] as const;
const STAGE_LABELS: Record<string, string> = { queued: 'Queued', speccing: 'Spec', building: 'Build', qa: 'QA' };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' });
  } catch { return iso; }
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d2 - d1) / 86400000);
}

function formatDuration(days: number): string {
  if (days === 0) return '<1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function getRatingDisplay(rating: string): { emoji: string; label: string } {
  switch (rating) {
    case 'nailed-it': case 'good': return { emoji: '🟢', label: 'Nailed it' };
    case 'acceptable': return { emoji: '🟡', label: 'Acceptable' };
    case 'needs-work': case 'bad': return { emoji: '🔴', label: 'Needs work' };
    case 'comment': return { emoji: '💬', label: 'Comment' };
    default: return { emoji: '⭐', label: rating };
  }
}

// ── Main Page ──

export default function HubResearchPage() {
  const { data: queueData, isLoading } = useSWR('/api/pipeline-queue', fetcher, { refreshInterval: 15000 });
  const briefs: PipelineItem[] = queueData?.briefs || [];

  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
  const [newBriefOpen, setNewBriefOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [commentDialogId, setCommentDialogId] = useState<string | null>(null);

  // Feedback state for the new system
  const [selectedRating, setSelectedRating] = useState<Record<string, 'nailed-it' | 'acceptable' | 'needs-work'>>({});
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});
  const [rollbackDialogId, setRollbackDialogId] = useState<string | null>(null);
  const [rollbackComment, setRollbackComment] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  // Reject with reason
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Edit brief
  const [editItem, setEditItem] = useState<PipelineItem | null>(null);
  const [ebTitle, setEbTitle] = useState('');
  const [ebProblem, setEbProblem] = useState('');
  const [ebSolution, setEbSolution] = useState('');
  const [ebImpact, setEbImpact] = useState('');
  const [ebPriority, setEbPriority] = useState<'HIGH' | 'MED' | 'LOW'>('MED');
  const [ebComplexity, setEbComplexity] = useState<'HIGH' | 'MED' | 'LOW'>('MED');

  // New brief form
  const [nbTitle, setNbTitle] = useState('');
  const [nbProblem, setNbProblem] = useState('');
  const [nbSolution, setNbSolution] = useState('');
  const [nbImpact, setNbImpact] = useState('');
  const [nbPriority, setNbPriority] = useState<'HIGH' | 'MED' | 'LOW'>('MED');
  const [nbComplexity, setNbComplexity] = useState<'HIGH' | 'MED' | 'LOW'>('MED');

  const refresh = useCallback(() => mutate('/api/pipeline-queue'), []);

  // Derived lists
  const pendingReview = briefs.filter(b => b.status === 'pending-review');
  const inProgress = briefs.filter(b => ['queued', 'speccing', 'building', 'qa'].includes(b.status));
  const shipped = briefs.filter(b => b.status === 'shipped');
  const parked = briefs.filter(b => b.status === 'parked');

  // ── Actions ──

  const doAction = async (briefId: string, action: () => Promise<Response>) => {
    setActioningIds(prev => new Set(prev).add(briefId));
    try {
      const res = await action();
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${err.error || 'Unknown'}`);
      }
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActioningIds(prev => { const s = new Set(prev); s.delete(briefId); return s; });
    }
  };

  const approve = (id: string) => doAction(id, () =>
    fetch('/api/pipeline-queue/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ briefId: id }) })
  );

  const park = (id: string) => doAction(id, () =>
    fetch('/api/pipeline-queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'parked' }) })
  );

  const openRejectDialog = (id: string) => {
    setRejectDialogId(id);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectDialogId) return;
    const id = rejectDialogId;
    const reason = rejectReason.trim();
    setRejectDialogId(null);
    setRejectReason('');
    doAction(id, () =>
      fetch('/api/pipeline-queue/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ briefId: id, reason: reason || undefined }) })
    );
  };

  const openEditDialog = (item: PipelineItem) => {
    setEditItem(item);
    setEbTitle(item.title);
    setEbProblem(item.problem || '');
    setEbSolution(item.solution || '');
    setEbImpact(item.impact || '');
    setEbPriority(item.priority);
    setEbComplexity(item.complexity);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await fetch('/api/pipeline-queue/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId: editItem.id, title: ebTitle, problem: ebProblem, solution: ebSolution, impact: ebImpact, priority: ebPriority, complexity: ebComplexity }),
    });
    setEditItem(null);
    refresh();
  };

  const submitFeedback = (
    id: string,
    rating: 'nailed-it' | 'acceptable' | 'needs-work',
    tags?: string[],
    comment?: string
  ) =>
    doAction(id, () =>
      fetch('/api/pipeline-queue/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: id, rating, tags, comment }),
      })
    );

  const confirmRollback = async () => {
    if (!rollbackDialogId || !rollbackComment.trim()) return;
    const id = rollbackDialogId;
    setRollingBack(true);
    try {
      const res = await fetch('/api/pipeline-queue/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: id, comment: rollbackComment.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Rollback failed: ${err.error || 'Unknown error'}`);
      } else {
        refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRollingBack(false);
      setRollbackDialogId(null);
      setRollbackComment('');
    }
  };

  const ingest = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/pipeline-queue/ingest', { method: 'POST' });
      const data = await res.json();
      if (data.ingested > 0) {
        alert(`Ingested ${data.ingested} new briefs`);
      } else {
        alert('No new briefs found');
      }
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  const createBrief = async () => {
    if (!nbTitle || !nbProblem || !nbSolution) return;
    const newItem = {
      id: `brief-${new Date().toISOString().slice(0, 10)}-${nbTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
      title: nbTitle, problem: nbProblem, solution: nbSolution, impact: nbImpact,
      description: `${nbProblem}\n\n${nbSolution}`,
      source: 'manual', sourceRef: null,
      status: 'pending-review', priority: nbPriority, complexity: nbComplexity,
      createdAt: new Date().toISOString(), approvedAt: '', assignee: '',
    };
    await fetch('/api/pipeline-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    setNewBriefOpen(false);
    setNbTitle(''); setNbProblem(''); setNbSolution(''); setNbImpact('');
    refresh();
  };

  // ── Pipeline Stage Dots ──

  function StageDots({ current }: { current: string }) {
    const idx = PIPELINE_STAGES.indexOf(current as typeof PIPELINE_STAGES[number]);
    return (
      <div className="flex items-center gap-1 my-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center">
            <div className={`flex flex-col items-center ${i <= idx ? '' : 'opacity-40'}`}>
              <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                i < idx ? 'bg-[#A8B5A0] border-[#A8B5A0]' :
                i === idx ? 'bg-[#B8B0C8] border-[#B8B0C8] animate-pulse' :
                'bg-muted border-border'
              }`} />
              <span className={`text-[10px] mt-0.5 ${i === idx ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 mb-3 ${i < idx ? 'bg-[#F5D547]' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Brief Card (Briefs tab) ──

  function BriefCard({ item }: { item: PipelineItem }) {
    const acting = actioningIds.has(item.id);
    const src = SOURCE_BADGES[item.source] || SOURCE_BADGES.manual;

    return (
      <Card className="hover:border-[#D4C5A9] transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{item.title}</CardTitle>
            <Badge className={`border ${PRIORITY_COLORS[item.priority]}`}>{item.priority}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
            <span className="text-muted-foreground">{formatDate(item.createdAt)}</span>
            <Badge variant="outline" className={`text-xs ${src.className}`}>{src.label}</Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">Complexity: {item.complexity}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Problem</p>
            <p className="text-sm">{item.problem || item.description || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Solution</p>
            <p className="text-sm">{item.solution || '—'}</p>
          </div>
          {item.impact && (
            <div className="bg-zinc-100 px-3 py-2 rounded border border-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-1">Impact</p>
              <p className="text-sm text-zinc-700">{item.impact}</p>
            </div>
          )}
          {/* Q Review Section */}
          <div className="bg-zinc-50 rounded border border-zinc-200 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
              🤖 Q Review
            </p>
            {item.qReview ? (
              <div className="space-y-1.5">
                {/* Recommendation pill + Complexity badge row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Recommendation pill */}
                  {(() => {
                    const rec = item.qReview.recommendation;
                    const pillMap: Record<string, { label: string; className: string }> = {
                      'approve':    { label: '✅ Approve',    className: 'bg-green-50 text-green-700 border-green-200' },
                      'park':       { label: '🅿️ Park',       className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                      'reject':     { label: '❌ Reject',     className: 'bg-red-50 text-red-700 border-red-200' },
                      'needs-info': { label: '❓ Needs Info', className: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
                    };
                    const pill = pillMap[rec] || { label: rec, className: 'bg-zinc-100 text-zinc-600 border-zinc-300' };
                    return (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pill.className}`}>
                        {pill.label}
                      </span>
                    );
                  })()}
                  {/* Complexity badge */}
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    item.qReview.complexityChanged
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {item.qReview.complexityChanged
                      ? `${item.complexity} → ${item.qReview.complexityAssessed} ⚠️`
                      : item.qReview.complexityAssessed}
                  </span>
                </div>
                {/* Risk summary */}
                {item.qReview.riskSummary && (
                  <p className="text-xs text-zinc-600">
                    <span className="font-medium text-zinc-700">Risk:</span> {item.qReview.riskSummary}
                  </p>
                )}
                {/* Missing info */}
                {item.qReview.missingInfo && item.qReview.missingInfo.length > 0 && (
                  <p className="text-xs text-zinc-600">
                    <span className="font-medium text-zinc-700">Missing:</span> {item.qReview.missingInfo.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Q Review pending</p>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-zinc-200 justify-between items-center">
            <Button size="sm" variant="outline" className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50" disabled={acting} onClick={() => openEditDialog(item)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#F5D547] hover:bg-[#e8c93e] text-zinc-900 border-0" disabled={acting} onClick={() => approve(item.id)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />{acting ? 'Working…' : 'Approve'}
              </Button>
              <Button size="sm" variant="outline" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200" disabled={acting} onClick={() => park(item.id)}>
                <PauseCircle className="h-3.5 w-3.5 mr-1" />Park
              </Button>
              <Button size="sm" variant="outline" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200" disabled={acting} onClick={() => openRejectDialog(item.id)}>
                <XCircle className="h-3.5 w-3.5 mr-1" />Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Stats Sidebar ──

  function BriefsSidebar() {
    const bySource: Record<string, number> = {};
    const byPriority: Record<string, number> = { HIGH: 0, MED: 0, LOW: 0 };
    pendingReview.forEach(b => {
      bySource[b.source] = (bySource[b.source] || 0) + 1;
      byPriority[b.priority] = (byPriority[b.priority] || 0) + 1;
    });
    const totalAll = briefs.length;
    const totalApproved = briefs.filter(b => !['pending-review', 'rejected', 'parked'].includes(b.status)).length;
    const approvalRate = totalAll > 0 ? Math.round((totalApproved / totalAll) * 100) : 0;

    return (
      <div className="space-y-4">
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Review</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingReview.length}</p>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Source</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(bySource).map(([src, n]) => (
              <div key={src} className="flex justify-between text-sm">
                <span>{SOURCE_BADGES[src]?.label || src}</span><span className="font-medium">{n}</span>
              </div>
            ))}
            {Object.keys(bySource).length === 0 && <p className="text-xs text-muted-foreground">None</p>}
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(byPriority).map(([p, n]) => (
              <div key={p} className="flex justify-between text-sm"><span>{p}</span><span className="font-medium">{n}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvalRate}%</p>
            <p className="text-xs text-muted-foreground">{totalApproved} / {totalAll} all-time</p>
          </CardContent>
        </Card>
        {parked.length > 0 && (
          <Card className="">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Parked</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-[#F5D547]">{parked.length}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function InProgressSidebar() {
    const bySt: Record<string, number> = { queued: 0, speccing: 0, building: 0, qa: 0 };
    inProgress.forEach(b => { if (bySt[b.status] !== undefined) bySt[b.status]++; });
    const shippedWithTimes = shipped.filter(b => b.approvedAt && b.shippedAt);
    const avgDays = shippedWithTimes.length > 0
      ? Math.round(shippedWithTimes.reduce((sum, b) => sum + daysBetween(b.approvedAt, b.shippedAt!), 0) / shippedWithTimes.length)
      : null;

    return (
      <div className="space-y-4">
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">In Pipeline</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgress.length}</p>
          </CardContent>
        </Card>
        <Card className="">
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Stage</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(bySt).map(([s, n]) => (
              <div key={s} className="flex justify-between text-sm">
                <span className="capitalize">{STAGE_LABELS[s] || s}</span><span className="font-medium">{n}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        {avgDays !== null && (
          <Card className="">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Time to Ship</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(avgDays)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function PerformanceSidebar() {
    const rated = shipped.filter(b => b.feedback);
    const nailedIt = rated.filter(b =>
      b.feedback?.rating === 'nailed-it' || b.feedback?.rating === 'good' // legacy compat
    ).length;
    const acceptable = rated.filter(b => b.feedback?.rating === 'acceptable').length;
    const needsWork = rated.filter(b =>
      b.feedback?.rating === 'needs-work' || b.feedback?.rating === 'bad' // legacy compat
    ).length;
    const rolledBack = rated.filter(b => b.feedback?.rolledBack).length;
    const pending = shipped.filter(b => !b.feedback).length;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Shipped</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{shipped.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🟢 Nailed It</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rated.length > 0 ? Math.round((nailedIt / rated.length) * 100) : 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🟡 Acceptable</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{acceptable}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🔴 Needs Work</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{needsWork}</p></CardContent>
        </Card>
        {rolledBack > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">⏪ Rolled Back</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-zinc-500">{rolledBack}</p></CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Feedback Pending</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[#F5D547]">{pending}</p></CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Pipeline</h1>
              <p className="text-zinc-500 text-sm">Brief management, specs, builds, and deployment tracking</p>
            </div>
            <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="briefs" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="briefs">Briefs {pendingReview.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-zinc-700 text-white">{pendingReview.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress {inProgress.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-zinc-100 text-zinc-700 border border-zinc-200">{inProgress.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* ── Briefs Tab ── */}
            <TabsContent value="briefs" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Pending Review</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={ingest} disabled={ingesting} className="">
                        <Download className="h-4 w-4 mr-1" />{ingesting ? 'Scanning…' : 'Ingest New'}
                      </Button>
                      <Button size="sm" onClick={() => setNewBriefOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />New Brief
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {isLoading ? (
                        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-40 animate-pulse" />)}</div>
                      ) : pendingReview.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-lg mb-2">No briefs pending review</p>
                          <p className="text-sm">Click &quot;Ingest New&quot; to scan for research briefs</p>
                        </div>
                      ) : (
                        pendingReview.map(item => <BriefCard key={item.id} item={item} />)
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="w-72 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full"><BriefsSidebar /></ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* ── In Progress Tab ── */}
            <TabsContent value="in-progress" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <h2 className="text-lg font-semibold mb-4">In Progress</h2>
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {inProgress.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-lg mb-2">Nothing in progress</p>
                          <p className="text-sm">Approve briefs to start the pipeline</p>
                        </div>
                      ) : (
                        inProgress.map(item => (
                          <Card key={item.id} className="">
                            <CardHeader className="pb-1">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">{item.title}</CardTitle>
                                <Badge className={`border ${PRIORITY_COLORS[item.priority]}`}>{item.priority}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Approved {item.approvedAt ? formatDate(item.approvedAt) : '—'}</span>
                                {item.assignee && <span>· {item.assignee}</span>}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <StageDots current={item.status} />
                              <p className="text-xs text-muted-foreground mt-1 capitalize">
                                Status: <span className="text-foreground font-medium">{item.status}</span>
                              </p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="w-72 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full"><InProgressSidebar /></ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* ── Shipped Tab ── */}
            <TabsContent value="shipped" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-zinc-900" />Shipped
                    </h2>
                    <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200">{shipped.length} shipped</Badge>
                  </div>
                  {shipped.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Rocket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg mb-2">Nothing shipped yet</p>
                      <p className="text-sm">Completed builds will appear here</p>
                    </div>
                  ) : (
                    shipped.map(item => (
                      <Card key={item.id} className="border-l-4 border-l-[#F5D547]">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{item.title}</CardTitle>
                            <Badge className={`border ${PRIORITY_COLORS[item.priority]}`}>{item.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Shipped {item.shippedAt ? formatDate(item.shippedAt) : '—'}</span>
                            {item.assignee && <span>· Built by {item.assignee}</span>}
                            {item.approvedAt && item.shippedAt && (
                              <span>· Brief → Ship: {formatDuration(daysBetween(item.approvedAt, item.shippedAt))}</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          {item.feedback && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {getRatingDisplay(item.feedback.rating).emoji} {getRatingDisplay(item.feedback.rating).label}
                                </Badge>
                                {item.feedback.rolledBack && (
                                  <Badge className="bg-red-50 text-red-600 border border-red-200">⏪ Rolled back</Badge>
                                )}
                                {item.feedback.tags?.map(tag => (
                                  <Badge key={tag} className="bg-zinc-50 text-zinc-600 border border-zinc-200 text-xs">{tag}</Badge>
                                ))}
                              </div>
                              {item.feedback.comment && <p className="text-xs text-muted-foreground mt-1">{item.feedback.comment}</p>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Performance Tab ── */}
            <TabsContent value="performance" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1">
                    <div className="space-y-6 pr-4">
                      {/* Pending Feedback */}
                      <div>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />Pending Feedback
                        </h2>
                        {shipped.filter(b => !b.feedback).length === 0 ? (
                          <p className="text-muted-foreground text-sm py-4">All shipped items have been rated 🎉</p>
                        ) : (
                          <div className="space-y-3">
                            {shipped.filter(b => !b.feedback).map(item => (
                              <Card key={item.id} className="">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                    <span className="text-xs text-muted-foreground">
                                      Shipped {item.shippedAt ? formatDate(item.shippedAt) : '—'}
                                    </span>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                                  {/* Step 1: Rating buttons */}
                                  <div className="flex gap-2 mb-3">
                                    {(['nailed-it', 'acceptable', 'needs-work'] as const).map(r => {
                                      const labels = { 'nailed-it': '🟢 Nailed it', 'acceptable': '🟡 Acceptable', 'needs-work': '🔴 Needs work' };
                                      const isSelected = selectedRating[item.id] === r;
                                      return (
                                        <Button
                                          key={r}
                                          size="sm"
                                          variant="outline"
                                          className={`text-xs transition-all ${isSelected
                                            ? 'bg-zinc-900 text-white border-zinc-900'
                                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                                          }`}
                                          disabled={actioningIds.has(item.id)}
                                          onClick={() => setSelectedRating(prev => ({
                                            ...prev,
                                            [item.id]: prev[item.id] === r ? undefined as unknown as 'nailed-it' | 'acceptable' | 'needs-work' : r,
                                          }))}
                                        >
                                          {labels[r]}
                                        </Button>
                                      );
                                    })}
                                  </div>

                                  {/* Step 2: Tags (shown only on 'acceptable' or 'needs-work') */}
                                  {(selectedRating[item.id] === 'acceptable' || selectedRating[item.id] === 'needs-work') && (
                                    <div className="mb-3 p-3 bg-zinc-50 rounded border border-zinc-200">
                                      <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
                                        Tags {selectedRating[item.id] === 'needs-work' && <span className="text-zinc-400">(1 required)</span>}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(['missed-spec', 'broke-existing', 'wrong-approach', 'incomplete', 'over-engineered', 'poor-quality', 'needed-context'] as const).map(tag => {
                                          const isTagSelected = (selectedTags[item.id] || []).includes(tag);
                                          return (
                                            <button
                                              key={tag}
                                              onClick={() => setSelectedTags(prev => {
                                                const cur = prev[item.id] || [];
                                                return {
                                                  ...prev,
                                                  [item.id]: isTagSelected ? cur.filter(t => t !== tag) : [...cur, tag],
                                                };
                                              })}
                                              className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                                                isTagSelected
                                                  ? 'bg-zinc-900 text-white border-zinc-900'
                                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                                              }`}
                                            >
                                              {tag}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Step 3: Comment field (shown when a rating is selected) */}
                                  {selectedRating[item.id] && (
                                    <div className="mb-3">
                                      <Textarea
                                        placeholder="Optional comment..."
                                        value={feedbackComment[item.id] || ''}
                                        onChange={e => setFeedbackComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Step 4: Submit + Rollback row */}
                                  <div className="flex items-center justify-between">
                                    <Button
                                      size="sm"
                                      disabled={
                                        actioningIds.has(item.id) ||
                                        !selectedRating[item.id] ||
                                        (selectedRating[item.id] === 'needs-work' && !(selectedTags[item.id]?.length))
                                      }
                                      onClick={() => submitFeedback(
                                        item.id,
                                        selectedRating[item.id]!,
                                        selectedTags[item.id],
                                        feedbackComment[item.id]
                                      )}
                                      className="bg-zinc-900 hover:bg-zinc-700 text-white"
                                    >
                                      Submit Rating
                                    </Button>

                                    {/* Rollback — only show if build has a commit hash */}
                                    {item.buildCommit && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-zinc-500 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                        disabled={actioningIds.has(item.id)}
                                        onClick={() => {
                                          setRollbackDialogId(item.id);
                                          setRollbackComment('');
                                        }}
                                      >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1" />Rollback Build
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rated */}
                      <div>
                        <h2 className="text-lg font-semibold mb-3">Rated</h2>
                        {shipped.filter(b => b.feedback).length === 0 ? (
                          <p className="text-muted-foreground text-sm py-4">No ratings yet</p>
                        ) : (
                          <div className="space-y-3">
                            {shipped.filter(b => b.feedback).map(item => (
                              <Card key={item.id} className="">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm">
                                      {item.title}
                                    </CardTitle>
                                    <span className="text-xs text-muted-foreground">Shipped {item.shippedAt ? formatDate(item.shippedAt) : '—'}</span>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {item.feedback && (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200">
                                          {getRatingDisplay(item.feedback.rating).emoji} {getRatingDisplay(item.feedback.rating).label}
                                        </Badge>
                                        {item.feedback.rolledBack && (
                                          <Badge className="bg-red-50 text-red-600 border border-red-200">⏪ Rolled back</Badge>
                                        )}
                                        {item.feedback.tags?.map(tag => (
                                          <Badge key={tag} className="bg-zinc-50 text-zinc-600 border border-zinc-200 text-xs">{tag}</Badge>
                                        ))}
                                      </div>
                                      {item.feedback.comment && (
                                        <p className="text-xs text-muted-foreground">{item.feedback.comment}</p>
                                      )}
                                    </div>
                                  )}
                                  {item.approvedAt && item.shippedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">Brief → Ship: {formatDuration(daysBetween(item.approvedAt, item.shippedAt))}</p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                <div className="w-72 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full"><PerformanceSidebar /></ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Brief Dialog */}
      <Dialog open={newBriefOpen} onOpenChange={setNewBriefOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Brief</DialogTitle>
            <DialogDescription>Manually add a brief to the pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Brief title" value={nbTitle} onChange={e => setNbTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Problem *</Label>
              <Textarea placeholder="What's broken or missing?" value={nbProblem} onChange={e => setNbProblem(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Solution *</Label>
              <Textarea placeholder="What would we build?" value={nbSolution} onChange={e => setNbSolution(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Impact</Label>
              <Textarea placeholder="Why should PJ care?" value={nbImpact} onChange={e => setNbImpact(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={nbPriority} onValueChange={v => setNbPriority(v as 'HIGH' | 'MED' | 'LOW')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MED">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={nbComplexity} onValueChange={v => setNbComplexity(v as 'HIGH' | 'MED' | 'LOW')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MED">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBriefOpen(false)}>Cancel</Button>
            <Button onClick={createBrief} disabled={!nbTitle || !nbProblem || !nbSolution}>Create Brief</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject with Reason Dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={() => setRejectDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Brief</DialogTitle>
            <DialogDescription>Why doesn&apos;t this fit? Your reason helps us stop generating similar ideas.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g. Too early — we don't have the data pipeline it needs yet. Or: Not relevant to our current priorities."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className=""
            />
            <p className="text-xs text-muted-foreground mt-2">Optional but recommended — logged to brief-log.md for pattern tracking.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>Cancel</Button>
            <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-100" onClick={confirmReject}>Reject Brief</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Brief Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Brief</DialogTitle>
            <DialogDescription>Refine before approving. Changes are saved to the pipeline queue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={ebTitle} onChange={e => setEbTitle(e.target.value)} className="" />
            </div>
            <div className="space-y-2">
              <Label>Problem</Label>
              <Textarea value={ebProblem} onChange={e => setEbProblem(e.target.value)} rows={2} placeholder="What's broken or missing?" className="" />
            </div>
            <div className="space-y-2">
              <Label>Solution</Label>
              <Textarea value={ebSolution} onChange={e => setEbSolution(e.target.value)} rows={2} placeholder="What would we build?" className="" />
            </div>
            <div className="space-y-2">
              <Label>Impact</Label>
              <Textarea value={ebImpact} onChange={e => setEbImpact(e.target.value)} rows={2} placeholder="Why should PJ care?" className="" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={ebPriority} onValueChange={v => setEbPriority(v as 'HIGH' | 'MED' | 'LOW')}>
                  <SelectTrigger className=""><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MED">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={ebComplexity} onValueChange={v => setEbComplexity(v as 'HIGH' | 'MED' | 'LOW')}>
                  <SelectTrigger className=""><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MED">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!ebTitle || !ebProblem || !ebSolution}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={!!commentDialogId} onOpenChange={() => setCommentDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Your feedback..."
              value={feedbackComment[commentDialogId || ''] || ''}
              onChange={e => setFeedbackComment(prev => ({ ...prev, [commentDialogId || '']: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogId(null)}>Cancel</Button>
            <Button onClick={() => {
              if (commentDialogId) {
                submitFeedback(commentDialogId, 'nailed-it', undefined, feedbackComment[commentDialogId]);
                setCommentDialogId(null);
              }
            }}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={!!rollbackDialogId} onOpenChange={() => setRollbackDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⏪ Rollback Build</DialogTitle>
            <DialogDescription>
              This will run <code>git revert</code> on the build commit. This action cannot be undone from the UI.
              The rating will be auto-set to 🔴 Needs Work with tag <code>broke-existing</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium">What broke? (required)</Label>
            <Textarea
              placeholder="Describe what broke and why rollback is needed..."
              value={rollbackComment}
              onChange={e => setRollbackComment(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogId(null)}>Cancel</Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              disabled={!rollbackComment.trim() || rollingBack}
              onClick={confirmRollback}
            >
              {rollingBack ? 'Rolling back…' : '⏪ Confirm Rollback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
