"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/components/search-results";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  path: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
}

const categories = [
  { value: "", label: "All" },
  { value: "memory", label: "Memory" },
  { value: "docs", label: "Docs" },
  { value: "project", label: "Projects" },
  { value: "activity", label: "Activity" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: searchQuery });
        if (category) params.set("category", category);

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        setResults(data.results || []);
        saveSearch(searchQuery);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleReindex = async () => {
    setIndexing(true);
    try {
      const res = await fetch("/api/index", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Indexed ${data.indexed} files`);
        // Re-run current search
        if (query) performSearch(query);
      }
    } catch (error) {
      console.error("Reindex failed:", error);
      alert("Reindexing failed");
    } finally {
      setIndexing(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // For now, just log. In the future, could open file viewer
    console.log("Clicked result:", result);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Global Search</h1>
        <p className="text-zinc-500 text-sm">
          Search across memory, docs, projects, and activity
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ⌕
          </span>
          <Input
            type="text"
            placeholder="Search everything... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 mb-6">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReindex}
          disabled={indexing}
        >
          {indexing ? "Indexing..." : "Reindex"}
        </Button>
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-zinc-200"
                onClick={() => setQuery(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : query ? (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;
            {query}&quot;
          </div>
          <SearchResults
            results={results}
            query={query}
            onResultClick={handleResultClick}
          />
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Start typing to search</p>
          <p className="text-sm">
            Search across memory files, docs, projects, and activity history
          </p>
        </div>
      )}
    </div>
  );
}
