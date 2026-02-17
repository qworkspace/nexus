"use client";

import { useState, useEffect } from "react";
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
  TrendingUp, ExternalLink, Plus, Wrench, Hammer, Star, AlertTriangle
} from "lucide-react";
import { ActiveBuilds } from '@/components/builds/ActiveBuilds';
import { PipelineView } from '@/components/builds/PipelineView';
import { CompletedBuilds } from '@/components/builds/CompletedBuilds';
import { BuildStats } from '@/components/builds/BuildStats';
import { BuildSpeedMetrics } from '@/components/builds/BuildSpeedMetrics';
import type { SpecQueueItem } from '@/app/api/ci/specs/route';
import type { BuildEntry, BuildSummary } from '@/app/api/ci/builds/route';
import type { ActiveSession } from '@/app/api/ci/active/route';
import ReactMarkdown from 'react-markdown';

type BriefStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";
type SourceTag = "research" | "pj-request" | "q-identified";

interface BriefItem {
  id: string;
  filename: string;
  title: string;
  bullets: string[];
  priority: "HIGH" | "MED" | "LOW";
  complexity: "LOW" | "MED" | "HIGH";
  status: BriefStatus;
  createdAt: string;
  sourceUrl?: string;
  notes?: string;
  sourceResearchId?: string;
  sourceModel?: string;
  sourceDate?: string;
  sourceTitle?: string;
  description?: string;
  buildOutcome?: string;
  category: 'research' | 'think' | 'request' | 'review';
  keyInsight?: string;
  proposedBuild?: string[];
  impact?: string[];
  oneLiner?: string;
}

interface ResearchItem {
  id: string;
  type: "deep-focus" | "whats-new" | "spec-briefs" | "specs";
  title: string;
  date: string;
  path: string;
  snippet: string;
  frontmatter?: Record<string, string | string[]>;
  sourceModel?: string;
  content?: string;
}

interface BriefStats {
  total: number;
  new: number;
  approved: number;
  parked: number;
  rejected: number;
  specced: number;
  building: number;
  shipped: number;
  review: number;
  approvalRate: number;
  avgTimeToShip: string;
  complexityBreakdown: { LOW: number; MED: number; HIGH: number };
  priorityBreakdown: { LOW: number; MED: number; HIGH: number };
}

interface FixEntry {
  id: string;
  spec: string;
  commit: string;
  whatBroke: string;
  whatFixed: string;
  when: string;
  status: 'open' | 'fix_briefed' | 'fix_building' | 'fix_shipped' | 'verified';
  sourceRating: 'bad' | 'useless';
  issues: string[];
  pjComment?: string;
  fixBriefPath?: string;
  fixCommit?: string;
  agent: string;
  context?: string;
}

interface FeedbackEntry {
  spec: string;
  commit: string;
  rating: 'great' | 'good' | 'meh' | 'bad' | 'useless';
  ratedBy: string;
  ratedAt: string;
  issues?: string[];
  context?: string;
}

export default function HubResearchPage() {
  const [briefs, setBriefs] = useState<BriefItem[]>([]);
  const [fixes, setFixes] = useState<FixEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<BriefStats | null>(null);
  const [loading, setLoading] = useState(true);

  // CI Pipeline Data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_specs, setSpecs] = useState<SpecQueueItem[]>([]);
  const [activeBuilds, setActiveBuilds] = useState<ActiveSession[]>([]);
  const [recentBuilds, setRecentBuilds] = useState<BuildEntry[]>([]);
  const [buildSummary, setBuildSummary] = useState<BuildSummary | null>(null);

  // New Brief Dialog state
  const [newBriefDialogOpen, setNewBriefDialogOpen] = useState(false);
  const [newBriefTitle, setNewBriefTitle] = useState("");
  const [newBriefBullets, setNewBriefBullets] = useState("");
  const [newBriefSource, setNewBriefSource] = useState<SourceTag>("research");
  const [newBriefPriority, setNewBriefPriority] = useState<"HIGH" | "MED" | "LOW">("MED" as const);
  const [newBriefComplexity, setNewBriefComplexity] = useState<"LOW" | "MED" | "HIGH">("MED" as const);
  const [newBriefSourceUrl, setNewBriefSourceUrl] = useState("");
  const [creatingBrief, setCreatingBrief] = useState(false);

  // Edit mode state
  const [editingBriefId, setEditingBriefId] = useState<string | null>(null);
  const [editedBrief, setEditedBrief] = useState<Partial<BriefItem>>({});

  // Slide-over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [loadingResearch, setLoadingResearch] = useState(false);

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [pendingRatingBrief, setPendingRatingBrief] = useState<BriefItem | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'park' | 'reject' | null>(null);
  const [selectedRating, setSelectedRating] = useState<'excellent' | 'good' | 'neutral' | 'poor' | null>(null);

  // AEST date formatter
  function formatAESTDateTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' AEST';
    } catch {
      return isoString;
    }
  }

  const handleViewSource = async (brief: BriefItem) => {
    setLoadingResearch(true);
    try {
      // The brief id IS the filename. The /api/research/[id] route searches spec-briefs dir.
      const res = await fetch(`/api/research/${encodeURIComponent(brief.id)}`);
      if (res.ok) {
        const research = await res.json();
        setSelectedResearch(research);
        setSlideOverOpen(true);
      } else {
        alert("Source document not found");
      }
    } catch (error) {
      console.error("Failed to load research:", error);
      alert("Failed to load source document");
    } finally {
      setLoadingResearch(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [briefsRes, statsRes, fixesRes, feedbackRes, specsRes, buildsRes, activeRes] = await Promise.all([
        fetch("/api/ideas"),
        fetch("/api/ideas/stats"),
        fetch("/api/fixes"),
        fetch("/api/builds/ratings"),
        fetch("/api/ci/specs", { cache: 'no-store' }),
        fetch("/api/ci/builds", { cache: 'no-store' }),
        fetch("/api/ci/active", { cache: 'no-store' }),
      ]);

      const briefsData = await briefsRes.json();
      const statsData = await statsRes.json();
      const fixesData = await fixesRes.json();
      const feedbackData = await feedbackRes.json();

      setBriefs(briefsData.briefs || []);
      setStats(statsData);
      setFixes(fixesData.fixes || []);
      setFeedback(feedbackData.feedback || []);

      // CI Pipeline data
      if (specsRes.ok) {
        const specsData = await specsRes.json();
        setSpecs(specsData);
      }

      if (buildsRes.ok) {
        const buildsData = await buildsRes.json();
        setRecentBuilds(buildsData.builds || []);
        setBuildSummary(buildsData.summary || null);
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveBuilds(activeData.sessions || []);
      }

      // Sync fixes from feedback (fire and forget)
      fetch('/api/fixes/sync', { method: 'POST' }).catch(console.error);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewBrief = async () => {
    if (!newBriefTitle || !newBriefBullets || !newBriefSource || !newBriefPriority || !newBriefComplexity) {
      return;
    }

    setCreatingBrief(true);
    try {
      const bullets = newBriefBullets
        .split("\n")
        .map(b => b.trim())
        .filter(b => b.length > 0);

      if (bullets.length < 3) {
        alert("Please provide at least 3 bullet points");
        setCreatingBrief(false);
        return;
      }

      const res = await fetch("/api/ideas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBriefTitle,
          description: bullets.join("\n"), // Use bullets as description
          benefits: bullets, // Use bullets as benefits
          successMetrics: [],
          source: newBriefSource,
          priority: newBriefPriority,
        }),
      });

      if (res.ok) {
        setNewBriefDialogOpen(false);
        setNewBriefTitle("");
        setNewBriefBullets("");
        setNewBriefSource("research");
        setNewBriefPriority("MED");
        setNewBriefComplexity("MED");
        setNewBriefSourceUrl("");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to create brief:", error);
    } finally {
      setCreatingBrief(false);
    }
  };

  const handleBriefApprove = async (briefId: string) => {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;

    // If not editing, open edit mode
    if (!editingBriefId) {
      setEditingBriefId(briefId);
      setEditedBrief(brief);
      return;
    }

    // If already editing, open rating modal instead of submitting directly
    setPendingRatingBrief(brief);
    setPendingAction('approve');
    setSelectedRating(null);
    setRatingModalOpen(true);
  };

  const handleBriefPark = async (briefId: string) => {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;

    // Open rating modal
    setPendingRatingBrief(brief);
    setPendingAction('park');
    setSelectedRating(null);
    setRatingModalOpen(true);
  };

  const handleBriefReject = async (briefId: string) => {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;

    // Open rating modal
    setPendingRatingBrief(brief);
    setPendingAction('reject');
    setSelectedRating(null);
    setRatingModalOpen(true);
  };

  const handleRatingSubmit = async (rating: 'excellent' | 'good' | 'neutral' | 'poor' | null) => {
    if (!pendingRatingBrief || !pendingAction) return;

    try {
      // For approve action, use the dedicated approve endpoint with edited data
      if (pendingAction === 'approve') {
        const res = await fetch(`/api/ideas/${pendingRatingBrief.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editedBrief.title || pendingRatingBrief.title,
            bullets: editedBrief.bullets || pendingRatingBrief.bullets,
            priority: editedBrief.priority || pendingRatingBrief.priority,
            complexity: editedBrief.complexity || pendingRatingBrief.complexity,
            notes: editedBrief.notes || pendingRatingBrief.notes,
            rating: rating,
          }),
        });

        if (res.ok) {
          setEditingBriefId(null);
          setEditedBrief({});
          setRatingModalOpen(false);
          setPendingRatingBrief(null);
          setPendingAction(null);
          setSelectedRating(null);
          await fetchData();
        }
      } else {
        // For park and reject, use the general ideas endpoint
        const res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pendingRatingBrief.id,
            action: pendingAction,
            rating: rating
          }),
        });

        if (res.ok) {
          setRatingModalOpen(false);
          setPendingRatingBrief(null);
          setPendingAction(null);
          setSelectedRating(null);
          await fetchData();
        }
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingBriefId(null);
    setEditedBrief({});
  };

  const getFixStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'fix_briefed': return 'bg-yellow-100 text-yellow-700';
      case 'fix_shipped': return 'bg-blue-100 text-blue-700';
      case 'verified': return 'bg-green-100 text-green-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getCategoryBadge = (category: 'research' | 'think' | 'request' | 'review') => {
    switch (category) {
      case 'research':
        return { icon: '🔬', className: 'bg-blue-900/30 text-blue-400 border border-blue-800' };
      case 'think':
        return { icon: '💭', className: 'bg-purple-900/30 text-purple-400 border border-purple-800' };
      case 'request':
        return { icon: '📋', className: 'bg-amber-900/30 text-amber-400 border border-amber-800' };
      case 'review':
        return { icon: '🔍', className: 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' };
    }
  };

  const getStatusColor = (status: BriefStatus) => {
    switch (status) {
      case "new":
        return "bg-zinc-100 text-zinc-700";
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      case "parked":
        return "bg-amber-100 text-amber-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "specced":
        return "bg-blue-100 text-blue-700";
      case "building":
        return "bg-violet-100 text-violet-700";
      case "shipped":
        return "bg-green-100 text-green-700";
      case "review":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getPriorityColor = (priority: "HIGH" | "MED" | "LOW") => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MED":
        return "bg-amber-100 text-amber-700";
      case "LOW":
        return "bg-green-100 text-green-700";
    }
  };

  function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();

    if (isNaN(date.getTime())) {
      return isoString;
    }

    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Rating badge component
  const RatingBadge = ({ rating }: { rating: string }) => {
    const config = {
      great: { emoji: '⭐', label: 'Great', color: 'text-green-600 bg-green-50' },
      good: { emoji: '👍', label: 'Good', color: 'text-green-600 bg-green-50' },
      meh: { emoji: '😐', label: 'Meh', color: 'text-yellow-600 bg-yellow-50' },
      bad: { emoji: '👎', label: 'Bad', color: 'text-red-600 bg-red-50' },
      useless: { emoji: '🗑', label: 'Useless', color: 'text-red-600 bg-red-50' },
    };

    const c = config[rating as keyof typeof config] || { emoji: '⏳', label: 'Awaiting', color: 'text-zinc-400' };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.color}`}>
        <span>{c.emoji}</span>
        <span>{c.label}</span>
      </span>
    );
  };

  // Status badge component for Fix Log
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const FixStatusBadge = ({ status }: { status: string }) => {
    const config = {
      open: { color: 'bg-red-100 text-red-700', icon: '🔴' },
      fix_briefed: { color: 'bg-yellow-100 text-yellow-700', icon: '📝' },
      fix_building: { color: 'bg-blue-100 text-blue-700', icon: '🔨' },
      fix_shipped: { color: 'bg-purple-100 text-purple-700', icon: '🚀' },
      verified: { color: 'bg-green-100 text-green-700', icon: '✅' },
    };

    const c = config[status as keyof typeof config] || config.open;

    return (
      <Badge className={c.color}>
        {c.icon} {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Brief Card Component
  function BriefCard({ brief, onApprove, onPark, onReject, onViewSource }: {
    brief: BriefItem;
    onApprove: (id: string) => void;
    onPark: (id: string) => void;
    onReject: (id: string) => void;
    onViewSource: (brief: BriefItem) => void;
  }) {
    const isEditing = editingBriefId === brief.id;
    const currentBrief = isEditing ? { ...brief, ...editedBrief } : brief;

    return (
      <Card className={`transition-all ${isEditing ? "ring-2 ring-blue-500" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
              <Input
                value={currentBrief.title}
                onChange={(e) => setEditedBrief({ ...editedBrief, title: e.target.value })}
                className="text-base font-semibold"
              />
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{brief.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 shrink-0"
                  onClick={() => onViewSource(brief)}
                  title="View source research"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <div className="flex gap-1 shrink-0">
              <Badge className={getCategoryBadge(brief.category).className}>
                {getCategoryBadge(brief.category).icon}
              </Badge>
              <Badge className={getStatusColor(brief.status)}>
                {brief.status}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(brief.priority)}>
                {brief.priority}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(brief.createdAt).toLocaleDateString()}
            </Badge>
            <Badge variant="outline">Complexity: {brief.complexity}</Badge>
            {(brief.sourceTitle || brief.sourceModel) && (
              <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                {brief.sourceModel && <span className="text-zinc-300">{brief.sourceModel}</span>}
                {brief.sourceModel && brief.sourceTitle && <span className="text-zinc-600 mx-1">·</span>}
                {brief.sourceTitle && <span>{brief.sourceTitle}</span>}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 3-5 key bullet points */}
          {isEditing ? (
            <div className="space-y-2">
              <Label>Key Points (3-5)</Label>
              <Textarea
                value={(currentBrief.bullets || []).join("\n")}
                onChange={(e) => setEditedBrief({
                  ...editedBrief,
                  bullets: e.target.value.split("\n").map(b => b.trim()).filter(b => b)
                })}
                rows={5}
                placeholder="Enter 3-5 key points..."
              />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {brief.keyInsight && (
                <div>
                  <span className="font-semibold text-zinc-200">Key Insight</span>
                  <p className="text-zinc-400 mt-1">{brief.keyInsight}</p>
                </div>
              )}
              {brief.proposedBuild && brief.proposedBuild.length > 0 && (
                <div>
                  <span className="font-semibold text-zinc-200">Proposed Build</span>
                  <ul className="mt-1 space-y-1">
                    {brief.proposedBuild.map((item, i) => (
                      <li key={i} className="flex gap-2 text-zinc-400">
                        <span className="text-zinc-600 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.impact && brief.impact.length > 0 && (
                <div className="bg-emerald-900/20 px-3 py-2 rounded border border-emerald-800/50">
                  <span className="font-semibold text-emerald-400">Impact</span>
                  <ul className="mt-1 space-y-1">
                    {brief.impact.map((item, i) => (
                      <li key={i} className="flex gap-2 text-emerald-300/80">
                        <span className="text-emerald-600 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(!brief.keyInsight && (!brief.proposedBuild || brief.proposedBuild.length === 0)) && (
                brief.oneLiner ? (
                  <p className="text-zinc-400">{brief.oneLiner}</p>
                ) : (
                  <p className="text-zinc-500 italic text-xs">Click source to view full brief</p>
                )
              )}
              {brief.buildOutcome && (
                <div className="bg-blue-900/30 p-2 rounded border border-blue-800">
                  <p className="text-blue-300 text-xs font-medium">🔨 Could build: {brief.buildOutcome}</p>
                </div>
              )}
            </div>
          )}

          {/* Complexity selector in edit mode */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Complexity</Label>
              <Select
                value={currentBrief.complexity || "MED"}
                onValueChange={(v) => setEditedBrief({ ...editedBrief, complexity: v as "LOW" | "MED" | "HIGH" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority selector in edit mode */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={currentBrief.priority || "MED"}
                onValueChange={(v) => setEditedBrief({ ...editedBrief, priority: v as "HIGH" | "MED" | "LOW" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes for Cipher */}
          {brief.notes && !isEditing && (
            <div className="bg-amber-50 p-2 rounded-md border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Cipher Notes:</strong> {brief.notes}
              </p>
            </div>
          )}

          {/* Notes input in edit mode */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Notes for Cipher (optional)</Label>
              <Textarea
                value={currentBrief.notes || ""}
                onChange={(e) => setEditedBrief({ ...editedBrief, notes: e.target.value })}
                rows={2}
                placeholder="Any notes for the AI agent..."
              />
            </div>
          )}

          {/* Action Buttons */}
          {(brief.status === "new" || brief.status === "review") && (
            <div className="flex gap-2 pt-2 border-t border-zinc-700 justify-center">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => onApprove(brief.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm & Send to Pipeline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    className="px-6"
                    onClick={() => onApprove(brief.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-6"
                    onClick={() => onPark(brief.id)}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Park
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-6 text-red-500 hover:text-red-400 border-red-800"
                    onClick={() => onReject(brief.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Stats Panel Component
  function StatsPanel({ stats }: { stats: BriefStats }) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-zinc-900">Brief Statistics</h3>

        {/* Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Total Briefs</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">New</span>
              <span className="font-medium">{stats.new}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Approved</span>
              <span className="font-medium text-emerald-600">{stats.approved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Parked</span>
              <span className="font-medium text-amber-600">{stats.parked}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Building</span>
              <span className="font-medium text-violet-600">{stats.building}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Shipped</span>
              <span className="font-medium text-green-600">{stats.shipped}</span>
            </div>
          </CardContent>
        </Card>

        {/* Approval Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Approved / Total</span>
              <span className="font-medium">
                {stats.approved} / {stats.total}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Rate</span>
              <span className="font-medium">
                {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Time to Ship */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Time to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{stats.avgTimeToShip || "N/A"}</p>
          </CardContent>
        </Card>

        {/* Complexity Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Complexity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.complexityBreakdown || {}).map(([level, count]) => (
              <div key={level} className="flex justify-between text-sm">
                <span className="text-zinc-500">{level}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.priorityBreakdown || {}).map(([level, count]) => (
              <div key={level} className="flex justify-between text-sm">
                <span className="text-zinc-500">{level}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
                  Pipeline
                </h1>
                <p className="text-zinc-500">
                  Brief management, builds, QA, and deployment tracking
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="brief-queue" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="brief-queue">Brief Queue</TabsTrigger>
              <TabsTrigger value="builds">Builds</TabsTrigger>
              <TabsTrigger value="qa">QA</TabsTrigger>
              <TabsTrigger value="fix-log">Fix Log</TabsTrigger>
            </TabsList>

            {/* Brief Queue Tab */}
            <TabsContent value="brief-queue" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Briefs List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Header with New Brief button */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Brief Queue</h2>
                    <Button onClick={() => setNewBriefDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Brief
                    </Button>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {loading ? (
                        <div className="space-y-3">
                          <Card className="h-40 animate-pulse" />
                          <Card className="h-40 animate-pulse" />
                          <Card className="h-40 animate-pulse" />
                        </div>
                      ) : briefs.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <p className="text-lg mb-2">No briefs yet</p>
                          <p className="text-sm">Create a brief or wait for auto-extraction from research</p>
                        </div>
                      ) : (
                        briefs.map((brief) => (
                          <BriefCard
                            key={brief.id}
                            brief={brief}
                            onApprove={handleBriefApprove}
                            onPark={handleBriefPark}
                            onReject={handleBriefReject}
                            onViewSource={handleViewSource}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Stats Panel */}
                <div className="w-80 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    {stats && <StatsPanel stats={stats} />}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* QA Tab */}
            <TabsContent value="qa" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 pb-4">
                  {/* Build Trends Summary */}
                  {buildSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Build Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                              {buildSummary.successRate}%
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Success Rate</p>
                          </div>
                          <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                              {buildSummary.totalBuilds}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Total Builds</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">
                              {buildSummary.successCount}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Successful</p>
                          </div>
                          <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-3xl font-bold text-red-600">
                              {buildSummary.failedCount}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Failed</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* PJ Ratings Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Recent PJ Ratings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {feedback.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <p className="text-sm">No ratings yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {feedback
                            .sort((a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime())
                            .slice(0, 10)
                            .map((f, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                <RatingBadge rating={f.rating} />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{f.spec}</p>
                                  {f.issues && f.issues.length > 0 && (
                                    <ul className="text-xs text-red-600 mt-1">
                                      {f.issues.map((issue, j) => (
                                        <li key={j}>• {issue}</li>
                                      ))}
                                    </ul>
                                  )}
                                  <p className="text-xs text-zinc-400 mt-1">
                                    {formatRelativeTime(f.ratedAt)} by {f.ratedBy}
                                  </p>
                                </div>
                                {(f.rating === 'bad' || f.rating === 'useless') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.dispatchEvent(new CustomEvent('navigate-to-fix-log', {
                                        detail: { spec: f.spec }
                                      }));
                                    }}
                                  >
                                    View in Fix Log
                                  </Button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* QA Gap Analysis Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        QA Gap Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-500 mb-4">
                        Builds that passed QA but received negative PJ ratings
                      </p>
                      {feedback.filter(f =>
                        (f.rating === 'bad' || f.rating === 'useless') &&
                        f.context?.includes('QA passed')
                      ).length === 0 ? (
                        <p className="text-sm text-zinc-500">No QA gaps detected</p>
                      ) : (
                        <div className="space-y-2">
                          {feedback
                            .filter(f =>
                              (f.rating === 'bad' || f.rating === 'useless') &&
                              f.context?.includes('QA passed')
                            )
                            .map((g, i) => (
                              <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="font-medium text-sm">{g.spec}</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                  QA passed but PJ rated {g.rating}
                                </p>
                                {g.issues && (
                                  <ul className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                                    {g.issues.map((issue, j) => (
                                      <li key={j}>• {issue}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Builds Panel */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Hammer className="h-5 w-5" />
                          What&apos;s Building Now ({activeBuilds.length})
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {activeBuilds.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <Hammer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Nothing building right now.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {activeBuilds.map((build) => (
                            <div key={build.id} className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                              <span className="text-2xl">🛠️</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-white text-lg truncate">
                                    Building: {build.key.replace(/^(spec-|ci-|dev-)/, '').replace(/-/g, ' ')}
                                  </h4>
                                  <span className="text-xs bg-yellow-900/50 text-yellow-400 px-3 py-1 rounded-full whitespace-nowrap">
                                    Building...
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400 mb-3">
                                  Started {formatRelativeTime(build.startedAt)}
                                </p>
                                <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg">
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recently Completed Panel */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Recently Completed ({recentBuilds.length})
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recentBuilds.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <p className="text-sm">No builds yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {recentBuilds.map((build) => {
                            const isSuccess = build.status === 'SUCCESS';
                            const isFailed = build.status === 'FAILED';

                            const icon = isSuccess ? '✅' : isFailed ? '❌' : '⚠️';
                            const statusText = isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'STALLED';
                            const statusColor = isSuccess ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-yellow-400';

                            return (
                              <div key={build.id} className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                                <span className="text-2xl">{icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white truncate">
                                      {build.spec.replace(/^(CI:\s*)?/, '').replace(/-/g, ' ')}
                                    </h4>
                                    <span className={`text-xs font-bold ${statusColor}`}>
                                      {statusText}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-400 mb-3">
                                    Completed {formatRelativeTime(build.timestamp)}
                                  </p>
                                  {build.testStatus && (
                                    <p className="text-sm text-zinc-400 mb-3">
                                      {isSuccess ? '✓' : '✗'} {build.testDetails || build.testStatus}
                                    </p>
                                  )}
                                  <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg">
                                    View Details
                                  </button>
                                  {!isSuccess && (
                                    <button className="w-full mt-2 bg-red-900/50 hover:bg-red-900/70 text-white text-sm py-2 px-4 rounded-lg">
                                      Retry Build
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Fix Log Tab - Read-only chronological log */}
            <TabsContent value="fix-log" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Fix Log</h2>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Wrench className="h-3 w-3 mr-1" />
                        {fixes.filter(f => f.status === 'open').length} open
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetch('/api/fixes/sync', { method: 'POST' }).then(fetchData)}
                      >
                        Sync from Feedback
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {loading ? (
                        <div className="space-y-3">
                          <Card className="h-24 animate-pulse" />
                          <Card className="h-24 animate-pulse" />
                        </div>
                      ) : fixes.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <p className="text-lg mb-2">No fixes logged</p>
                          <p className="text-sm">When builds are rated &quot;bad&quot; or &quot;useless&quot;, they&apos;ll appear here</p>
                        </div>
                      ) : (
                        fixes.map((fix, index) => (
                          <Card key={fix.id || index}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">
                                  {fix.spec || `Fix #${index + 1}`}
                                </CardTitle>
                                <div className="flex gap-1">
                                  {fix.status && (
                                    <Badge className={getFixStatusColor(fix.status)}>
                                      {fix.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(fix.when).toLocaleDateString()}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {/* What Broke */}
                              <div>
                                <p className="text-xs font-medium text-red-600 mb-1">What broke</p>
                                <p className="text-sm text-zinc-700">{fix.whatBroke}</p>
                                {fix.issues && fix.issues.length > 0 && (
                                  <ul className="mt-1 text-xs text-zinc-500 list-disc list-inside">
                                    {fix.issues.map((issue, i) => (
                                      <li key={i}>{issue}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              
                              {/* Context */}
                              {fix.context && (
                                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                  <p className="text-xs text-amber-700">
                                    <strong>Context:</strong> {fix.context}
                                  </p>
                                </div>
                              )}
                              
                              {/* What Fixed (if any) */}
                              {fix.whatFixed && (
                                <div>
                                  <p className="text-xs font-medium text-emerald-600 mb-1">What was fixed</p>
                                  <p className="text-sm text-zinc-700">{fix.whatFixed}</p>
                                </div>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span>Agent: {fix.agent}</span>
                                {fix.commit && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{fix.commit}</span>
                                  </>
                                )}
                                {fix.sourceRating && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      Rated: {fix.sourceRating}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Builds Tab */}
            <TabsContent value="builds" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 pb-4">
                  {/* Stats Row */}
                  <div>
                    <BuildStats />
                  </div>

                  {/* Active Builds */}
                  <div>
                    <ActiveBuilds />
                  </div>

                  {/* Pipeline View */}
                  <PipelineView />

                  {/* Completed Builds */}
                  <CompletedBuilds />

                  {/* Build Speed Metrics */}
                  <BuildSpeedMetrics />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Brief Dialog */}
      <Dialog open={newBriefDialogOpen} onOpenChange={setNewBriefDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Brief</DialogTitle>
            <DialogDescription>
              Add a new brief to the Brief Queue for tracking and approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="brief-title">Title *</Label>
              <Input
                id="brief-title"
                placeholder="Brief title"
                value={newBriefTitle}
                onChange={(e) => setNewBriefTitle(e.target.value)}
              />
            </div>

            {/* Bullets */}
            <div className="space-y-2">
              <Label htmlFor="brief-bullets">Key Points (3-5, one per line) *</Label>
              <Textarea
                id="brief-bullets"
                placeholder="• First key point&#10;• Second key point&#10;• Third key point"
                value={newBriefBullets}
                onChange={(e) => setNewBriefBullets(e.target.value)}
                rows={5}
              />
            </div>

            {/* Source Tag */}
            <div className="space-y-2">
              <Label htmlFor="brief-source">Source *</Label>
              <Select value={newBriefSource} onValueChange={(v) => setNewBriefSource(v as SourceTag)}>
                <SelectTrigger id="brief-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="pj-request">PJ Request</SelectItem>
                  <SelectItem value="q-identified">Q Identified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="brief-priority">Priority *</Label>
              <Select value={newBriefPriority} onValueChange={(v) => setNewBriefPriority(v as "HIGH" | "MED" | "LOW")}>
                <SelectTrigger id="brief-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Complexity */}
            <div className="space-y-2">
              <Label htmlFor="brief-complexity">Complexity *</Label>
              <Select value={newBriefComplexity} onValueChange={(v) => setNewBriefComplexity(v as "LOW" | "MED" | "HIGH")}>
                <SelectTrigger id="brief-complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source URL */}
            <div className="space-y-2">
              <Label htmlFor="brief-source-url">Source URL (optional)</Label>
              <Input
                id="brief-source-url"
                placeholder="https://..."
                value={newBriefSourceUrl}
                onChange={(e) => setNewBriefSourceUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBriefDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewBrief}
              disabled={creatingBrief || !newBriefTitle || !newBriefBullets}
            >
              {creatingBrief ? "Creating..." : "Create Brief"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Research Slide-Over Panel */}
      {slideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setSlideOverOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-zinc-900 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedResearch?.title || "Research"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      {selectedResearch?.type === "deep-focus" ? "Deep Focus" :
                       selectedResearch?.type === "whats-new" ? "What's New" :
                       selectedResearch?.type}
                    </Badge>
                    {selectedResearch?.sourceModel && (
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">{selectedResearch.sourceModel}</Badge>
                    )}
                    {selectedResearch?.date && (
                      <span>{formatAESTDateTime(selectedResearch.date)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSlideOverOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                {loadingResearch ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                  </div>
                ) : selectedResearch?.content ? (
                  <div className="prose prose-sm prose-invert max-w-none text-zinc-300">
                    <ReactMarkdown>{selectedResearch.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-zinc-400">No content available</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How was this brief?</DialogTitle>
            <DialogDescription>
              Rate the quality of &quot;{pendingRatingBrief?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant={selectedRating === 'excellent' ? 'default' : 'outline'}
              className="h-16 flex-col gap-1"
              onClick={() => setSelectedRating('excellent')}
            >
              <span className="text-2xl">⭐</span>
              <span className="text-xs">Well-captured problem</span>
            </Button>
            <Button
              variant={selectedRating === 'good' ? 'default' : 'outline'}
              className="h-16 flex-col gap-1"
              onClick={() => setSelectedRating('good')}
            >
              <span className="text-2xl">👍</span>
              <span className="text-xs">Good enough</span>
            </Button>
            <Button
              variant={selectedRating === 'neutral' ? 'default' : 'outline'}
              className="h-16 flex-col gap-1"
              onClick={() => setSelectedRating('neutral')}
            >
              <span className="text-2xl">😐</span>
              <span className="text-xs">Not priority</span>
            </Button>
            <Button
              variant={selectedRating === 'poor' ? 'default' : 'outline'}
              className="h-16 flex-col gap-1"
              onClick={() => setSelectedRating('poor')}
            >
              <span className="text-2xl">👎</span>
              <span className="text-xs">Wrong problem</span>
            </Button>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={() => handleRatingSubmit(selectedRating)}
              disabled={!selectedRating}
              className="w-full"
            >
              Submit Rating &amp; {pendingAction?.charAt(0).toUpperCase()}{pendingAction?.slice(1)}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleRatingSubmit(null)}
              className="w-full text-zinc-500"
            >
              Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
