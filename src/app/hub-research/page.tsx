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
  TrendingUp, ExternalLink, Plus, Wrench, FileText, Hammer
} from "lucide-react";
import { ActiveBuilds } from '@/components/builds/ActiveBuilds';
import { PipelineView } from '@/components/builds/PipelineView';
import { CompletedBuilds } from '@/components/builds/CompletedBuilds';
import { BuildStats } from '@/components/builds/BuildStats';
import { BuildSpeedMetrics } from '@/components/builds/BuildSpeedMetrics';
import type { SpecQueueItem } from '@/app/api/ci/specs/route';
import type { BuildEntry, BuildSummary } from '@/app/api/ci/builds/route';
import type { ActiveSession } from '@/app/api/ci/active/route';

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
  whatBroke: string;
  whatFixed: string;
  when: string;
  agent: string;
}

export default function HubResearchPage() {
  const [briefs, setBriefs] = useState<BriefItem[]>([]);
  const [fixes, setFixes] = useState<FixEntry[]>([]);
  const [stats, setStats] = useState<BriefStats | null>(null);
  const [loading, setLoading] = useState(true);

  // CI Pipeline Data
  const [specs, setSpecs] = useState<SpecQueueItem[]>([]);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [briefsRes, statsRes, fixesRes, specsRes, buildsRes, activeRes] = await Promise.all([
        fetch("/api/ideas"),
        fetch("/api/ideas/stats"),
        fetch("/api/fixes"),
        fetch("/api/ci/specs", { cache: 'no-store' }),
        fetch("/api/ci/builds", { cache: 'no-store' }),
        fetch("/api/ci/active", { cache: 'no-store' }),
      ]);

      const briefsData = await briefsRes.json();
      const statsData = await statsRes.json();
      const fixesData = await fixesRes.json();

      setBriefs(briefsData.briefs || []);
      setStats(statsData);
      setFixes(fixesData.fixes || []);

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

    // If already editing, submit for approval
    try {
      const res = await fetch(`/api/ideas/${briefId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedBrief.title || brief.title,
          bullets: editedBrief.bullets || brief.bullets,
          priority: editedBrief.priority || brief.priority,
          complexity: editedBrief.complexity || brief.complexity,
          notes: editedBrief.notes || brief.notes,
        }),
      });

      if (res.ok) {
        setEditingBriefId(null);
        setEditedBrief({});
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to approve brief:", error);
    }
  };

  const handleBriefPark = async (briefId: string) => {
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: briefId, action: "park" }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to park brief:", error);
    }
  };

  const handleBriefReject = async (briefId: string) => {
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: briefId, action: "reject" }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to reject brief:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingBriefId(null);
    setEditedBrief({});
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

  // Brief Card Component
  function BriefCard({ brief, onApprove, onPark, onReject, onViewSource }: {
    brief: BriefItem;
    onApprove: (id: string) => void;
    onPark: (id: string) => void;
    onReject: (id: string) => void;
    onViewSource: (url: string) => void;
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
              <CardTitle className="text-base">{brief.title}</CardTitle>
            )}

            <div className="flex gap-1 shrink-0">
              <Badge className={getStatusColor(brief.status)}>
                {brief.status}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(brief.priority)}>
                {brief.priority}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(brief.createdAt).toLocaleDateString()}
            </Badge>
            <Badge variant="outline">Complexity: {brief.complexity}</Badge>
            {brief.sourceUrl && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewSource(brief.sourceUrl!)}
                className="text-xs h-6"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Source
              </Button>
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
            <ul className="space-y-1 text-sm text-zinc-600">
              {(brief.bullets || []).slice(0, 5).map((bullet, i) => (
                <li key={i}>• {bullet}</li>
              ))}
            </ul>
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
          {brief.status === "new" && (
            <div className="flex gap-2 pt-2 border-t border-zinc-200">
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
                    className="flex-1"
                    onClick={() => onApprove(brief.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onPark(brief.id)}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Park
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
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
          <Tabs defaultValue="brief-bank" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="brief-bank">Brief Bank</TabsTrigger>
              <TabsTrigger value="builds">Builds</TabsTrigger>
              <TabsTrigger value="qa">QA</TabsTrigger>
              <TabsTrigger value="fix-log">Fix Log</TabsTrigger>
            </TabsList>

            {/* Brief Bank Tab */}
            <TabsContent value="brief-bank" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Briefs List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Header with New Brief button */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Brief Bank</h2>
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
                            onViewSource={(url) => window.open(url, "_blank")}
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

                  {/* Spec Queue Panel */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Next Up ({specs.length} spec{specs.length !== 1 ? 's' : ''} waiting)
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {specs.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No specs queued. All caught up!</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {specs.map((spec) => (
                            <div key={spec.id} className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                              <span className="text-xl">📋</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                  {spec.title}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  Created: {spec.createdAt}
                                </p>
                              </div>
                              {spec.priority === 'HIGH' && (
                                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded whitespace-nowrap">
                                  Critical
                                </span>
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
                    <Badge variant="secondary">
                      <Wrench className="h-3 w-3 mr-1" />
                      Read-only
                    </Badge>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {loading ? (
                        <div className="space-y-3">
                          <Card className="h-24 animate-pulse" />
                          <Card className="h-24 animate-pulse" />
                          <Card className="h-24 animate-pulse" />
                        </div>
                      ) : fixes.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <p className="text-lg mb-2">No fixes logged</p>
                          <p className="text-sm">Automated bug fixes will appear here</p>
                        </div>
                      ) : (
                        fixes.map((fix, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">Fix #{index + 1}</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(fix.when).toLocaleString()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-red-600 mb-1">What broke</p>
                                <p className="text-sm text-zinc-700">{fix.whatBroke}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-emerald-600 mb-1">What was fixed</p>
                                <p className="text-sm text-zinc-700">{fix.whatFixed}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Agent</p>
                                <p className="text-sm text-zinc-700">{fix.agent}</p>
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
              Add a new brief to the Brief Bank for tracking and approval
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
    </div>
  );
}
