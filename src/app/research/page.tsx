"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Download, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";

interface ResearchItem {
  date: string;
  title: string;
  sources: string[];
  highlights: string[];
  critical: string[];
  notable: string[];
  actions: string[];
}

export default function ResearchPage() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchResearch();
  }, []);

  const fetchResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/research");
      const data = await res.json();
      setResearch(data.research);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error("Failed to fetch research:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResearch = research.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
              Research Feed
            </h1>
            <p className="text-zinc-500">
              Daily research findings, AI insights, and action items
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleString()}
            </Badge>
            <button
              onClick={fetchResearch}
              disabled={loading}
              className="p-2 hover:bg-zinc-100 rounded-md transition-colors"
              title="Refresh"
            >
              <Download className="h-4 w-4 text-zinc-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search research items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md bg-white text-sm"
        />
      </div>

      {/* Research Grid */}
      {loading ? (
        <div className="space-y-4">
          <Card className="h-48 animate-pulse" />
          <Card className="h-48 animate-pulse" />
          <Card className="h-48 animate-pulse" />
        </div>
      ) : filteredResearch.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg mb-2">No research found</p>
          <p className="text-sm">
            Research Intel will appear here as it&apos;s generated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResearch.map((item) => (
            <ResearchCard key={item.date} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchCard({ item }: { item: ResearchItem }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {item.date}
              </Badge>
              {item.sources.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {item.sources.length} scan{item.sources.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critical Items */}
        {item.critical.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Critical</span>
            </div>
            <ul className="space-y-1">
              {item.critical.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notable Items */}
        {item.notable.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>Notable</span>
            </div>
            <ul className="space-y-1">
              {item.notable.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlights */}
        {item.highlights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Highlights</span>
            </div>
            <ul className="space-y-1">
              {item.highlights.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className="pt-2 border-t border-zinc-200">
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>Actions Taken</span>
            </div>
            <ul className="space-y-1">
              {item.actions.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
