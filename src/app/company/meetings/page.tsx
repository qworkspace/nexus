"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Meeting {
  id: string;
  filename: string;
  date: string;
  type: string;
  title: string;
  size: number;
  modified: string;
}

export default function MeetingsPage() {
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("selected"));
  const [content, setContent] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/company/meetings").then(r => r.json()).then(d => {
      setMeetings(d.meetings || []);
      if (!selectedId && d.meetings?.length > 0) {
        setSelectedId(d.meetings[0].id);
      }
    });
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/company/meetings/${selectedId}`).then(r => r.json()).then(d => {
        setContent(d.content || "Meeting not found");
      });
    }
  }, [selectedId]);

  const filtered = typeFilter === "all" ? meetings : meetings.filter(m => m.type === typeFilter);
  const types = [...new Set(meetings.map(m => m.type))];

  const typeIcons: Record<string, string> = {
    standup: "🗣️",
    "sync-content": "🎨",
    "sync-engineering": "💻",
    allhands: "🏢",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/company" className="text-sm text-blue-500 hover:underline mb-2 inline-block">← Company HQ</Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">📋 Meeting Viewer</h1>
          <p className="text-zinc-500 text-sm">{meetings.length} meetings logged</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${typeFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
          >
            All
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              {typeIcons[t] || "📋"} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Meeting List */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedId === m.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
              >
                <div className="flex items-center gap-2">
                  <span>{typeIcons[m.type] || "📋"}</span>
                  <span className={`text-sm font-medium ${selectedId === m.id ? "text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {m.title}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${selectedId === m.id ? "text-zinc-300" : "text-zinc-400"}`}>
                  {m.date}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">No meetings found</p>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-h-[80vh] overflow-y-auto">
          {content ? (
            <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
              <MeetingContent content={content} />
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">Select a meeting to view its transcript</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingContent({ content }: { content: string }) {
  // Simple markdown-ish rendering
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-md font-semibold text-zinc-900 dark:text-zinc-100 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.includes(":**")) {
          const [speaker, ...rest] = line.split(":**");
          return (
            <div key={i} className="mt-3">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{speaker.replace(/\*\*/g, "")}:</span>
              <span className="text-zinc-700 dark:text-zinc-300"> {rest.join(":**")}</span>
            </div>
          );
        }
        if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-2 text-sm"><span>☐</span><span className="text-zinc-700 dark:text-zinc-300">{line.slice(6)}</span></div>;
        if (line.startsWith("- [x] ")) return <div key={i} className="flex items-center gap-2 text-sm"><span>✅</span><span className="text-zinc-500 line-through">{line.slice(6)}</span></div>;
        if (line.startsWith("- ")) return <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300 pl-4">• {line.slice(2)}</div>;
        if (line.startsWith("---")) return <hr key={i} className="border-zinc-200 dark:border-zinc-800 my-4" />;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{line}</p>;
      })}
    </div>
  );
}
