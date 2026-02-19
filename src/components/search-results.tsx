"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  path: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onResultClick?: (result: SearchResult) => void;
}

const categoryColors: Record<string, string> = {
  memory: "bg-zinc-100 text-zinc-700",
  docs: "bg-zinc-100 text-zinc-800",
  project: "bg-zinc-100 text-zinc-800",
  activity: "bg-zinc-100 text-[#FFE135]",
};

const categoryIcons: Record<string, string> = {
  memory: "◈",
  docs: "◫",
  project: "◇",
  activity: "◎",
};

function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = terms.some(
      (term) => part.toLowerCase() === term.toLowerCase()
    );
    if (isMatch) {
      return (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function formatPath(path: string): string {
  // Shorten paths for display
  return path
    .replace(process.env.HOME || "~", "~")
    .replace("/Users/paulvillanueva", "~");
}

export function SearchResults({
  results,
  query,
  onResultClick,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg mb-2">No results found</p>
        <p className="text-sm">Try different search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Card
          key={result.id}
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            onResultClick && "hover:ring-2 hover:ring-zinc-200"
          )}
          onClick={() => onResultClick?.(result)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg text-zinc-400">
                {categoryIcons[result.category] || "○"}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-zinc-900">
                    {highlightMatches(result.title, query)}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", categoryColors[result.category])}
                  >
                    {result.category}
                  </Badge>
                </div>

                <p className="text-sm text-zinc-600 mb-2">
                  {highlightMatches(result.snippet, query)}
                </p>

                <p className="text-xs text-zinc-400 font-mono truncate">
                  {formatPath(result.path)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
