"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Download, AlertTriangle, Lightbulb, CheckCircle, X, ExternalLink, Calendar, ChevronRight } from "lucide-react";

interface ResearchItem {
  date: string;
  title: string;
  sources: string[];
  highlights: string[];
  critical: string[];
  notable: string[];
  actions: string[];
  rawContent?: string;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'think_session': { label: 'Think Session', color: 'text-zinc-700', bgColor: 'bg-zinc-100' },
  'research_scan': { label: 'Research Scan', color: 'text-zinc-700', bgColor: 'bg-zinc-100' },
  'ai_intel': { label: 'AI Intel', color: 'text-zinc-700', bgColor: 'bg-zinc-100' },
  'memo': { label: 'Memo', color: 'text-zinc-700', bgColor: 'bg-zinc-100' },
  'morning_brief': { label: 'Morning Brief', color: 'text-sky-700', bgColor: 'bg-sky-100' },
  'evening_brief': { label: 'Evening Brief', color: 'text-zinc-700', bgColor: 'bg-zinc-100' },
};

export default function ResearchPage() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResearch();
  }, []);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedItem(null), 300);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && isPanelOpen) {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedItem(null), 300);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen]);

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

  const openSlideOver = (item: ResearchItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };

  const closeSlideOver = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const getSourceConfig = (source: string) => {
    return SOURCE_CONFIG[source] || { label: source, color: 'text-zinc-700', bgColor: 'bg-zinc-100' };
  };

  return (
    <>
      <div className="p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
                Research Feed
              </h1>
              <p className="text-muted-foreground">
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
                <Download className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search research items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md bg-white text-sm text-zinc-900"
          />
        </div>

        {/* Source Filter - Made More Visible */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all bg-card text-foreground shadow"
          >
            All Sources
          </button>
          {Object.entries(SOURCE_CONFIG).slice(0, 4).map(([key, config]) => (
            <button
              key={key}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all border border-zinc-200 hover:bg-zinc-100 ${config.color}`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Research Grid */}
        {loading ? (
          <div className="space-y-4">
            <Card className="h-48 animate-pulse" />
            <Card className="h-48 animate-pulse" />
            <Card className="h-48 animate-pulse" />
          </div>
        ) : filteredResearch.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No research found</p>
            <p className="text-sm">
              Research Intel will appear here as it&apos;s generated.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResearch.map((item, index) => (
              <ResearchCard 
                key={item.date + index} 
                item={item} 
                onClick={() => openSlideOver(item)}
                getSourceConfig={getSourceConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Panel */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSlideOver}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-zinc-200 z-50 transform transition-transform duration-300 ease-out ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedItem && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-foreground" />
                <h2 className="text-lg font-semibold text-zinc-900">Research Details</h2>
              </div>
              <button
                onClick={closeSlideOver}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-muted-foreground hover:text-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">{selectedItem.title}</h3>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3">
                {/* Date */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{selectedItem.date}</span>
                </div>

                {/* Source Badges - Prominent */}
                {selectedItem.sources.map((source) => {
                  const config = getSourceConfig(source);
                  return (
                    <div key={source} className={`px-3 py-1.5 rounded-lg ${config.bgColor} ${config.color}`}>
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Critical Items - Raw content, no bullet transform */}
              {selectedItem.critical.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Critical</span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                    {selectedItem.critical.map((item, i) => (
                      <p key={i} className="text-sm text-zinc-700">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Notable Items */}
              {selectedItem.notable.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm mb-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Notable</span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                    {selectedItem.notable.map((item, i) => (
                      <p key={i} className="text-sm text-zinc-700">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {selectedItem.highlights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-900 font-medium text-sm mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Highlights</span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                    {selectedItem.highlights.map((item, i) => (
                      <p key={i} className="text-sm text-zinc-700">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedItem.actions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-900 font-medium text-sm mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Actions</span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                    {selectedItem.actions.map((item, i) => (
                      <p key={i} className="text-sm text-zinc-700">{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200">
              <button
                onClick={closeSlideOver}
                className="w-full py-2 px-4 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ResearchCard({ 
  item, 
  onClick,
  getSourceConfig 
}: { 
  item: ResearchItem; 
  onClick: () => void;
  getSourceConfig: (source: string) => { label: string; color: string; bgColor: string };
}) {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group hover:border-zinc-300" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-zinc-900">{item.title}</CardTitle>
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
          <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source Badges - Prominent, More Visible */}
        {item.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.sources.map((source) => {
              const config = getSourceConfig(source);
              return (
                <span 
                  key={source} 
                  className={`text-xs px-2.5 py-1 rounded-md font-medium ${config.bgColor} ${config.color}`}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Critical Items - Raw content, no bullet transform */}
        {item.critical.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Critical</span>
            </div>
            <div className="space-y-1">
              {item.critical.slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm text-zinc-700 line-clamp-1">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notable Items */}
        {item.notable.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>Notable</span>
            </div>
            <div className="space-y-1">
              {item.notable.slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm text-zinc-700 line-clamp-1">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {item.highlights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-900 font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Highlights</span>
            </div>
            <div className="space-y-1">
              {item.highlights.slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm text-zinc-700 line-clamp-1">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className="pt-2 border-t border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-900 font-medium text-sm mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>Actions</span>
            </div>
            <div className="space-y-1">
              {item.actions.slice(0, 3).map((item, i) => (
                <p key={i} className="text-sm text-zinc-700 line-clamp-1">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
