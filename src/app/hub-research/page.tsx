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
  RefreshCw, Clock, CheckCircle, XCircle, PauseCircle, ArrowRight,
  TrendingUp, ExternalLink, Plus, Wrench
} from "lucide-react";

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
      const [briefsRes, statsRes, fixesRes] = await Promise.all([
        fetch("/api/ideas"),
        fetch("/api/ideas/stats"),
        fetch("/api/fixes"),
      ]);

      const briefsData = await briefsRes.json();
      const statsData = await statsRes.json();
      const fixesData = await fixesRes.json();

      setBriefs(briefsData.briefs || []);
      setStats(statsData);
      setFixes(fixesData.fixes || []);
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
                  Research Hub v3
                </h1>
                <p className="text-zinc-500">
                  Brief management, fix logs, and pipeline tracking
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
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="brief-bank">Brief Bank</TabsTrigger>
              <TabsTrigger value="fix-log">Fix Log</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
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

            {/* Pipeline Tab - Existing visualization */}
            <TabsContent value="pipeline" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Build Pipeline</CardTitle>
                    <p className="text-sm text-zinc-500">
                      Track briefs from approval to deployment
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Pipeline Visualization */}
                      <div className="flex items-center justify-between text-sm">
                        {[
                          { label: "New", status: "new" as BriefStatus, count: stats?.new || 0 },
                          { label: "Approved", status: "approved" as BriefStatus, count: stats?.approved || 0 },
                          { label: "Specced", status: "specced" as BriefStatus, count: stats?.specced || 0 },
                          { label: "Building", status: "building" as BriefStatus, count: stats?.building || 0 },
                          { label: "Shipped", status: "shipped" as BriefStatus, count: stats?.shipped || 0 },
                        ].map((stage, i) => (
                          <div key={stage.label} className="flex items-center flex-1">
                            <div className={`text-center flex-1 ${stage.count > 0 ? "font-bold" : ""}`}>
                              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(stage.status)} mb-2`}>
                                {stage.count}
                              </div>
                              <div>{stage.label}</div>
                            </div>
                            {i < 4 && <ArrowRight className="h-4 w-4 text-zinc-400" />}
                          </div>
                        ))}
                      </div>

                      {/* Link to Builds Dashboard */}
                      <div className="pt-4 border-t border-zinc-200">
                        <Button variant="outline" className="w-full" asChild>
                          <a href="/builds">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Builds Dashboard
                          </a>
                        </Button>
                      </div>

                      {/* Recent Approved Briefs */}
                      {briefs.filter((b) => b.status === "approved").length > 0 && (
                        <div className="pt-4 border-t border-zinc-200">
                          <h4 className="text-sm font-medium text-zinc-900 mb-3">Recently Approved</h4>
                          <div className="space-y-2">
                            {briefs
                              .filter((b) => b.status === "approved")
                              .slice(0, 5)
                              .map((brief) => (
                                <div
                                  key={brief.id}
                                  className="flex items-center justify-between p-2 rounded-md bg-zinc-50"
                                >
                                  <span className="text-sm truncate flex-1 mr-2">{brief.title}</span>
                                  <Badge className={getPriorityColor(brief.priority)}>{brief.priority}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
