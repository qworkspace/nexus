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
  Search, RefreshCw, Clock, FileText, Lightbulb, CheckCircle,
  XCircle, PauseCircle, ArrowRight, TrendingUp, Brain, Newspaper,
  Star, ThumbsUp, ThumbsDown, AlertTriangle, Plus, Wrench
} from "lucide-react";

type ResearchType = "deep-focus" | "whats-new";
type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";
type SourceTag = "research" | "pj-request" | "q-identified";

interface ResearchItem {
  id: string;
  type: ResearchType;
  title: string;
  date: string;
  path: string;
  snippet: string;
  frontmatter?: Record<string, unknown>;
}

interface IdeaSummary {
  idea?: string;
  title?: string;
  summary?: string;
  benefits?: string[];
  successMetrics?: string[];
  notes?: string;
  keyFindings?: string[];
  tags?: string[];
  priority?: string;
  generatedAt?: string;
}

interface IdeaItem {
  id: string;
  filename: string;
  title: string;
  problem: string;
  solution: string;
  priority: string;
  complexity: string;
  status: IdeaStatus;
  createdAt: string;
  path: string;
  summary?: IdeaSummary;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
}

interface IdeasStats {
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
  successRate: number;
  completionRate: number;
}

interface ResearchDetail {
  id: string;
  type: string;
  title: string;
  content: string;
  date: string;
  path: string;
}

interface FixEntry {
  whatBroke: string;
  whatFixed: string;
  when: string;
  agent: string;
}

export default function HubResearchPage() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [fixes, setFixes] = useState<FixEntry[]>([]);
  const [stats, setStats] = useState<IdeasStats | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<ResearchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResearchType | "all">("all" as const);

  // New Idea Dialog state
  const [newIdeaDialogOpen, setNewIdeaDialogOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDescription, setNewIdeaDescription] = useState("");
  const [newIdeaBenefits, setNewIdeaBenefits] = useState("");
  const [newIdeaSuccessMetrics, setNewIdeaSuccessMetrics] = useState("");
  const [newIdeaSource, setNewIdeaSource] = useState<SourceTag>("research");
  const [newIdeaPriority, setNewIdeaPriority] = useState<"HIGH" | "MED" | "LOW">("MED" as const);
  const [creatingIdea, setCreatingIdea] = useState(false);

  // Review Dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingIdea, setReviewingIdea] = useState<IdeaItem | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<"success" | "partial" | "failed">("success");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [researchRes, ideasRes, statsRes, fixesRes] = await Promise.all([
        fetch("/api/research?intelligenceOnly=true&limit=100"),
        fetch("/api/ideas"),
        fetch("/api/ideas/stats"),
        fetch("/api/fixes"),
      ]);

      const researchData = await researchRes.json();
      const ideasData = await ideasRes.json();
      const statsData = await statsRes.json();
      const fixesData = await fixesRes.json();

      setResearch(researchData.research || []);
      setIdeas(ideasData.ideas || []);
      setStats(statsData);
      setFixes(fixesData.fixes || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResearchClick = async (id: string) => {
    try {
      const res = await fetch(`/api/research/${id}`);
      const data = await res.json();
      setSelectedResearch(data);
    } catch (error) {
      console.error("Failed to fetch research detail:", error);
    }
  };

  const handleCreateIdeaFromResearch = async (researchItem: ResearchItem) => {
    setNewIdeaTitle(researchItem.title);
    setNewIdeaDescription(`Based on research: ${researchItem.snippet}`);
    setNewIdeaDialogOpen(true);
  };

  const handleCreateNewIdea = async () => {
    if (!newIdeaTitle || !newIdeaDescription || !newIdeaSource || !newIdeaPriority) {
      return;
    }

    setCreatingIdea(true);
    try {
      const benefits = newIdeaBenefits
        .split("\n")
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const successMetrics = newIdeaSuccessMetrics
        .split("\n")
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const res = await fetch("/api/ideas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIdeaTitle,
          description: newIdeaDescription,
          benefits,
          successMetrics,
          source: newIdeaSource,
          priority: newIdeaPriority,
        }),
      });

      if (res.ok) {
        setNewIdeaDialogOpen(false);
        setNewIdeaTitle("");
        setNewIdeaDescription("");
        setNewIdeaBenefits("");
        setNewIdeaSuccessMetrics("");
        setNewIdeaSource("research");
        setNewIdeaPriority("MED");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to create idea:", error);
    } finally {
      setCreatingIdea(false);
    }
  };

  const filteredResearch = research.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const visibleIdeas = ideas.filter((idea) => idea.status !== "rejected");

  const getTypeIcon = (type: ResearchType) => {
    switch (type) {
      case "deep-focus":
        return <Brain className="h-4 w-4" />;
      case "whats-new":
        return <Newspaper className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ResearchType) => {
    switch (type) {
      case "deep-focus":
        return "Deep Focus";
      case "whats-new":
        return "What's New";
      default:
        return type;
    }
  };

  const getStatusColor = (status: IdeaStatus) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MED":
        return "bg-amber-100 text-amber-700";
      case "LOW":
        return "bg-green-100 text-green-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getReviewOutcomeColor = (outcome: "success" | "partial" | "failed") => {
    switch (outcome) {
      case "success":
        return "bg-green-100 text-green-700 border-green-300";
      case "partial":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "failed":
        return "bg-red-100 text-red-700 border-red-300";
    }
  };

  const getReviewOutcomeIcon = (outcome: "success" | "partial" | "failed") => {
    switch (outcome) {
      case "success":
        return <ThumbsUp className="h-3 w-3" />;
      case "partial":
        return <AlertTriangle className="h-3 w-3" />;
      case "failed":
        return <ThumbsDown className="h-3 w-3" />;
    }
  };

  const handleIdeaAction = async (id: string, action: "approve" | "park" | "reject") => {
    try {
      const res = await fetch(`/api/ideas/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to update idea:", error);
    }
  };

  const handleOpenReviewDialog = (idea: IdeaItem) => {
    setReviewingIdea(idea);
    setReviewOutcome("success");
    setReviewNote("");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingIdea) return;

    try {
      const res = await fetch(`/api/ideas/${reviewingIdea.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: reviewOutcome,
          note: reviewNote,
        }),
      });

      if (res.ok) {
        setReviewDialogOpen(false);
        setReviewingIdea(null);
        setReviewNote("");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

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
                  Research Hub v2
                </h1>
                <p className="text-zinc-500">
                  Research intelligence, idea management, fix logs, and pipeline tracking
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
          <Tabs defaultValue="research-feed" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="research-feed">Research Feed</TabsTrigger>
              <TabsTrigger value="idea-bank">Idea Bank</TabsTrigger>
              <TabsTrigger value="fix-log">Fix Log</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>

            {/* Research Feed Tab - Intelligence Only */}
            <TabsContent value="research-feed" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Feed List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Search & Filter */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search research intelligence..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-1">
                      {(["all", "deep-focus", "whats-new"] as const).map((type) => (
                        <Button
                          key={type}
                          variant={typeFilter === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTypeFilter(type)}
                        >
                          {getTypeLabel(type as ResearchType)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Research Cards */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {loading ? (
                        <div className="space-y-3">
                          <Card className="h-32 animate-pulse" />
                          <Card className="h-32 animate-pulse" />
                          <Card className="h-32 animate-pulse" />
                        </div>
                      ) : filteredResearch.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <p className="text-lg mb-2">No research found</p>
                          <p className="text-sm">
                            {searchQuery
                              ? "Try a different search term"
                              : "Research will appear here as it's generated"}
                          </p>
                        </div>
                      ) : (
                        filteredResearch.map((item) => (
                          <Card
                            key={`${item.type}-${item.id}`}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle
                                  className="text-base flex-1 cursor-pointer"
                                  onClick={() => handleResearchClick(item.id)}
                                >
                                  {item.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className="gap-1">
                                    {getTypeIcon(item.type)}
                                    <span>{getTypeLabel(item.type)}</span>
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleCreateIdeaFromResearch(item)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Idea
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(item.date).toLocaleDateString()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-zinc-600 line-clamp-2">{item.snippet}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Detail Panel */}
                <div className="w-1/2 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    {selectedResearch ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
                            {selectedResearch.title}
                          </h2>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="gap-1">
                              {getTypeIcon(selectedResearch.type as ResearchType)}
                              <span>{getTypeLabel(selectedResearch.type as ResearchType)}</span>
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(selectedResearch.date).toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm">
                            {selectedResearch.content}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400">
                        <p>Select a research item to view details</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Idea Bank Tab - All Ideas */}
            <TabsContent value="idea-bank" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Ideas List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Header with New Idea button */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Idea Bank</h2>
                    <Button onClick={() => setNewIdeaDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Idea
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
                      ) : visibleIdeas.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <p className="text-lg mb-2">No ideas found</p>
                          <p className="text-sm">Create your first idea to get started</p>
                        </div>
                      ) : (
                        visibleIdeas.map((idea) => (
                          <Card
                            key={idea.id}
                            className={`transition-all ${
                              idea.status === "parked" ? "opacity-50" : ""
                            }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">{idea.title}</CardTitle>
                                <div className="flex gap-1 shrink-0">
                                  <Badge variant="outline" className={getPriorityColor(idea.priority)}>
                                    {idea.priority}
                                  </Badge>
                                  <Badge className={getStatusColor(idea.status)}>
                                    {idea.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(idea.createdAt).toLocaleDateString()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Complexity: {idea.complexity}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Summary Display */}
                              {idea.summary ? (
                                <div className="space-y-2">
                                  {/* What's the idea */}
                                  {(idea.summary.idea || idea.summary.summary) && (
                                    <div className="flex gap-2">
                                      <Lightbulb className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 mb-0.5">What is the idea?</p>
                                        <p className="text-sm text-zinc-700">{idea.summary.idea || idea.summary.summary}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Benefits */}
                                  {idea.summary.benefits && idea.summary.benefits.length > 0 && (
                                    <div className="flex gap-2">
                                      <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 mb-0.5">Why is it beneficial?</p>
                                        <ul className="text-sm text-zinc-700 space-y-1">
                                          {idea.summary.benefits.map((benefit, i) => (
                                            <li key={i}>• {benefit}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}

                                  {/* Success Metrics */}
                                  {idea.summary.successMetrics && idea.summary.successMetrics.length > 0 && (
                                    <div className="flex gap-2">
                                      <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 mb-0.5">Success Metrics</p>
                                        <ul className="text-sm text-zinc-700 space-y-1">
                                          {idea.summary.successMetrics.map((metric, i) => (
                                            <li key={i}>• {metric}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {idea.summary.notes && (
                                    <div className="flex gap-2">
                                      <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 mb-0.5">Notes</p>
                                        <p className="text-sm text-zinc-700">{idea.summary.notes}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Findings (fallback for benefits) */}
                                  {!idea.summary.benefits && idea.summary.keyFindings && idea.summary.keyFindings.length > 0 && (
                                    <div className="flex gap-2">
                                      <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-medium text-zinc-500 mb-0.5">Key Findings</p>
                                        <ul className="text-sm text-zinc-700 space-y-1">
                                          {idea.summary.keyFindings.map((finding, i) => (
                                            <li key={i}>• {finding}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Graceful fallback to Problem/Solution */
                                <>
                                  <div>
                                    <p className="text-xs font-medium text-zinc-500 mb-1">Problem</p>
                                    <p className="text-sm text-zinc-700">{idea.problem}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-zinc-500 mb-1">Solution</p>
                                    <p className="text-sm text-zinc-700">{idea.solution}</p>
                                  </div>
                                </>
                              )}

                              {/* Review Outcome Badge */}
                              {idea.reviewOutcome && (
                                <div className={`flex items-center gap-2 p-2 rounded-md border ${getReviewOutcomeColor(idea.reviewOutcome)}`}>
                                  {getReviewOutcomeIcon(idea.reviewOutcome)}
                                  <div className="flex-1">
                                    <p className="text-xs font-medium capitalize">{idea.reviewOutcome}</p>
                                    {idea.reviewNote && <p className="text-xs mt-0.5">{idea.reviewNote}</p>}
                                  </div>
                                </div>
                              )}

                              {idea.status === "new" && (
                                <div className="flex gap-2 pt-2 border-t border-zinc-200">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1"
                                    onClick={() => handleIdeaAction(idea.id, "approve")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleIdeaAction(idea.id, "park")}
                                  >
                                    <PauseCircle className="h-4 w-4 mr-1" />
                                    Park
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleIdeaAction(idea.id, "reject")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {/* Review Button for Shipped Ideas */}
                              {idea.status === "shipped" && (
                                <div className="pt-2 border-t border-zinc-200">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="w-full"
                                    onClick={() => handleOpenReviewDialog(idea)}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Review Outcome
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Stats Panel */}
                <div className="w-80 border-l border-zinc-200 pl-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    {stats && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-zinc-900">Idea Statistics</h3>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Overview</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Total Ideas</span>
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
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Pipeline Status</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Specced</span>
                              <span className="font-medium text-blue-600">{stats.specced}</span>
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
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Metrics</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Approval Rate</span>
                              <span className="font-medium">
                                {(stats.approvalRate * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Avg Time to Ship</span>
                              <span className="font-medium">{stats.avgTimeToShip}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Completion Rate</span>
                              <span className="font-medium">{(stats.completionRate * 100).toFixed(0)}%</span>
                            </div>
                            {stats.review > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Success Rate</span>
                                <span className="font-medium text-emerald-600">
                                  {(stats.successRate * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
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
                      Track ideas from approval to deployment
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Pipeline Visualization */}
                      <div className="flex items-center justify-between text-sm">
                        {[
                          { label: "Idea", status: "new" as IdeaStatus, count: stats?.new || 0 },
                          { label: "Approved", status: "approved" as IdeaStatus, count: stats?.approved || 0 },
                          { label: "Specced", status: "specced" as IdeaStatus, count: stats?.specced || 0 },
                          { label: "Building", status: "building" as IdeaStatus, count: stats?.building || 0 },
                          { label: "Live", status: "shipped" as IdeaStatus, count: stats?.shipped || 0 },
                          { label: "Reviewed", status: "review" as IdeaStatus, count: stats?.review || 0 },
                        ].map((stage, i) => (
                          <div key={stage.label} className="flex items-center flex-1">
                            <div className={`text-center flex-1 ${stage.count > 0 ? "font-bold" : ""}`}>
                              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(stage.status)} mb-2`}>
                                {stage.count}
                              </div>
                              <div>{stage.label}</div>
                            </div>
                            {i < 5 && <ArrowRight className="h-4 w-4 text-zinc-400" />}
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

                      {/* Recent Approved Ideas */}
                      {ideas.filter((i) => i.status === "approved").length > 0 && (
                        <div className="pt-4 border-t border-zinc-200">
                          <h4 className="text-sm font-medium text-zinc-900 mb-3">Recently Approved</h4>
                          <div className="space-y-2">
                            {ideas
                              .filter((i) => i.status === "approved")
                              .slice(0, 5)
                              .map((idea) => (
                                <div
                                  key={idea.id}
                                  className="flex items-center justify-between p-2 rounded-md bg-zinc-50"
                                >
                                  <span className="text-sm truncate flex-1 mr-2">{idea.title}</span>
                                  <Badge className={getPriorityColor(idea.priority)}>{idea.priority}</Badge>
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

      {/* New Idea Dialog */}
      <Dialog open={newIdeaDialogOpen} onOpenChange={setNewIdeaDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Idea</DialogTitle>
            <DialogDescription>
              Add a new idea to the Idea Bank for tracking and approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="idea-title">Title *</Label>
              <Input
                id="idea-title"
                placeholder="Brief title for the idea"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="idea-description">Description *</Label>
              <Textarea
                id="idea-description"
                placeholder="Describe the problem or opportunity..."
                value={newIdeaDescription}
                onChange={(e) => setNewIdeaDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label htmlFor="idea-benefits">Benefits (one per line)</Label>
              <Textarea
                id="idea-benefits"
                placeholder="What value does this bring?"
                value={newIdeaBenefits}
                onChange={(e) => setNewIdeaBenefits(e.target.value)}
                rows={3}
              />
            </div>

            {/* Success Metrics */}
            <div className="space-y-2">
              <Label htmlFor="idea-metrics">Success Metrics (one per line)</Label>
              <Textarea
                id="idea-metrics"
                placeholder="How will we measure success?"
                value={newIdeaSuccessMetrics}
                onChange={(e) => setNewIdeaSuccessMetrics(e.target.value)}
                rows={3}
              />
            </div>

            {/* Source Tag */}
            <div className="space-y-2">
              <Label htmlFor="idea-source">Source *</Label>
              <Select value={newIdeaSource} onValueChange={(v) => setNewIdeaSource(v as SourceTag)}>
                <SelectTrigger id="idea-source">
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
              <Label htmlFor="idea-priority">Priority *</Label>
              <Select value={newIdeaPriority} onValueChange={(v) => setNewIdeaPriority(v as "HIGH" | "MED" | "LOW")}>
                <SelectTrigger id="idea-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewIdeaDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewIdea}
              disabled={creatingIdea || !newIdeaTitle || !newIdeaDescription}
            >
              {creatingIdea ? "Creating..." : "Create Idea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Idea Outcome</DialogTitle>
            <DialogDescription>
              How did &ldquo;{reviewingIdea?.title}&rdquo; perform after shipping?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Outcome Selector */}
            <div className="space-y-2">
              <Label>Outcome</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={reviewOutcome === "success" ? "default" : "outline"}
                  className={reviewOutcome === "success" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => setReviewOutcome("success")}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Success
                </Button>
                <Button
                  variant={reviewOutcome === "partial" ? "default" : "outline"}
                  className={reviewOutcome === "partial" ? "bg-amber-600 hover:bg-amber-700" : ""}
                  onClick={() => setReviewOutcome("partial")}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Partial
                </Button>
                <Button
                  variant={reviewOutcome === "failed" ? "default" : "outline"}
                  className={reviewOutcome === "failed" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => setReviewOutcome("failed")}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Failed
                </Button>
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <Label htmlFor="review-note">Notes (optional)</Label>
              <Textarea
                id="review-note"
                placeholder="What worked? What didn't? Any lessons learned?"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
