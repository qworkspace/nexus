"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, RefreshCw, Clock, FileText, Lightbulb, CheckCircle,
  XCircle, PauseCircle, ArrowRight, TrendingUp, Brain, Newspaper
} from "lucide-react";

type ResearchType = "deep-focus" | "whats-new" | "spec-briefs" | "specs" | "all";
type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped";

interface ResearchItem {
  id: string;
  type: ResearchType;
  title: string;
  date: string;
  path: string;
  snippet: string;
  frontmatter?: Record<string, unknown>;
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
  approvalRate: number;
  avgTimeToShip: string;
}

interface ResearchDetail {
  id: string;
  type: string;
  title: string;
  content: string;
  date: string;
  path: string;
}

export default function HubResearchPage() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [stats, setStats] = useState<IdeasStats | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<ResearchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResearchType>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [researchRes, ideasRes, statsRes] = await Promise.all([
        fetch("/api/research"),
        fetch("/api/ideas"),
        fetch("/api/ideas/stats"),
      ]);

      const researchData = await researchRes.json();
      const ideasData = await ideasRes.json();
      const statsData = await statsRes.json();

      setResearch(researchData.research || []);
      setIdeas(ideasData.ideas || []);
      setStats(statsData);
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
      case "spec-briefs":
        return <Lightbulb className="h-4 w-4" />;
      case "specs":
        return <FileText className="h-4 w-4" />;
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
      case "spec-briefs":
        return "Spec Brief";
      case "specs":
        return "Full Spec";
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
                  Research Hub
                </h1>
                <p className="text-zinc-500">
                  Browse research output and manage ideas for the build pipeline
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
          <Tabs defaultValue="feed" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="feed">Research Feed</TabsTrigger>
              <TabsTrigger value="ideas">Idea Bank</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>

            {/* Research Feed Tab */}
            <TabsContent value="feed" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Feed List */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Search & Filter */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search research..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-1">
                      {(["all", "deep-focus", "whats-new", "spec-briefs", "specs"] as const).map((type) => (
                        <Button
                          key={type}
                          variant={typeFilter === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTypeFilter(type)}
                        >
                          {getTypeLabel(type)}
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
                              : "Research will appear here as it&apos;s generated"}
                          </p>
                        </div>
                      ) : (
                        filteredResearch.map((item) => (
                          <Card
                            key={`${item.type}-${item.id}`}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleResearchClick(item.id)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">{item.title}</CardTitle>
                                <Badge variant="outline" className="shrink-0 gap-1">
                                  {getTypeIcon(item.type)}
                                  <span>{getTypeLabel(item.type)}</span>
                                </Badge>
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

            {/* Idea Bank Tab */}
            <TabsContent value="ideas" className="h-[calc(100%-60px)] mt-4 overflow-hidden">
              <div className="flex h-full gap-4">
                {/* Ideas List */}
                <div className="flex-1 overflow-hidden flex flex-col">
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
                          <p className="text-sm">Spec briefs will appear here as they&apos;re generated</p>
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
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Problem</p>
                                <p className="text-sm text-zinc-700">{idea.problem}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-1">Solution</p>
                                <p className="text-sm text-zinc-700">{idea.solution}</p>
                              </div>
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
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Pipeline Tab */}
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
    </div>
  );
}
