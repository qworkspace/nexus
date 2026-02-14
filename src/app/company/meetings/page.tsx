"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, FileText, Square, CheckSquare, Inbox, CheckCircle, XCircle, HelpCircle, Check } from "lucide-react";
import { MeetingIcon } from "@/lib/ui-icons";
import { AgentIcon } from "@/lib/agent-icons";

interface Meeting {
  id: string;
  filename: string;
  date: string;
  type: string;
  title: string;
  size: number;
  modified: string;
  topics?: string[];
}

interface ActionItem {
  id: string;
  assignee: string;
  task: string;
  priority: string;
  status: string;
  source: { meeting: string; date: string };
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  outcome: string | null;
  blockedBy: string | null;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export default function MeetingsPage() {
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("selected"));
  const [content, setContent] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [topicFilter] = useState<string>("all");
  const [meetingTopics, setMeetingTopics] = useState<Record<string, string[]>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/company/meetings").then(r => r.json()).then(d => {
      setMeetings(d.meetings || []);
      if (!selectedId && d.meetings?.length > 0) {
        setSelectedId(d.meetings[0].id);
      }
    });
    fetch("/api/company/actions").then(r => r.json()).then(d => setActionItems(d.items || []));
    fetch("/api/company/roster").then(r => r.json()).then(d => setAgents(d.agents || []));
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/company/meetings/${selectedId}`).then(r => r.json()).then(d => {
        setContent(d.content || "Meeting not found");
      });

      setSummaryLoading(true);
      fetch(`/api/company/meetings/${selectedId}/summary`, { method: "POST" })
        .then(r => r.json())
        .then(d => {
          setSummary(d.summary);
          setMeetingTopics(prev => ({ ...prev, [selectedId]: d.topics || [] }));
        })
        .catch(() => setSummary(null))
        .finally(() => setSummaryLoading(false));
    }
  }, [selectedId]);

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
  for (const a of agents) {
    agentMap[a.name.toLowerCase()] = a;
  }

  const filtered = typeFilter === "all"
    ? meetings
    : meetings.filter(m => m.type === typeFilter);

  const topicFiltered = topicFilter === "all"
    ? filtered
    : filtered.filter(m => meetingTopics[m.id]?.includes(topicFilter));

  const types = [...new Set(meetings.map(m => m.type))];

  // Filter action items for selected meeting
  const selectedMeeting = meetings.find(m => m.id === selectedId);
  const meetingActions = selectedId
    ? actionItems.filter(i => i.source?.meeting === selectedId || i.source?.date === selectedMeeting?.date)
    : [];
  const otherActions = actionItems.filter(i => !meetingActions.includes(i));

  const updateStatus = async (itemId: string, status: string) => {
    await fetch(`/api/company/actions/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const d = await fetch("/api/company/actions").then(r => r.json());
    setActionItems(d.items || []);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/company" className="text-xs text-blue-500 hover:underline mb-2 inline-block">← The Core</Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar size={20} />
            Meetings
          </h1>
          <p className="text-zinc-500 text-xs">{meetings.length} meetings · {actionItems.length} action items</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${typeFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
          >
            All
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${typeFilter === t ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              <MeetingIcon type={t} size={12} />
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Meeting List */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {topicFiltered.map(m => {
              const topics = meetingTopics[m.id] || [];
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors ${selectedId === m.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <MeetingIcon type={m.type} size={14} />
                    <span className={`text-xs font-medium ${selectedId === m.id ? "text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {m.title}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${selectedId === m.id ? "text-zinc-300" : "text-zinc-400"}`}>
                    {m.date}
                  </p>
                  {topics.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {topics.slice(0, 3).map(t => (
                        <span key={t} className={`px-1 py-0.5 rounded text-[8px] font-medium ${selectedId === m.id ? "bg-zinc-700 text-zinc-200" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                          {t}
                        </span>
                      ))}
                      {topics.length > 3 && (
                        <span className={`text-[8px] ${selectedId === m.id ? "text-zinc-300" : "text-zinc-400"}`}>
                          +{topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {topicFiltered.length === 0 && (
              <p className="text-zinc-500 text-xs text-center py-4">No meetings found</p>
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Transcript */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            {content ? (
              <div>
                {/* Summary */}
                {summaryLoading && (
                  <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-[10px] text-zinc-500 animate-pulse">Generating summary...</p>
                  </div>
                )}
                {summary && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                      <FileText size={12} />
                      TL;DR
                    </h3>
                    <div className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-line leading-relaxed">
                      {summary}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {meetingTopics[selectedId!]?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-1 flex-wrap">
                      {meetingTopics[selectedId!].map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-zinc dark:prose-invert prose-xs max-w-none">
                  <MeetingContent content={content} />
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8 text-xs">Select a meeting to view its transcript</p>
            )}
          </div>

          {/* Action Items from this meeting */}
          {selectedId && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-3">
                <Inbox size={14} />
                Action Items
                {meetingActions.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-normal">
                    {meetingActions.length} from this meeting
                  </span>
                )}
              </h3>

              {meetingActions.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {meetingActions.map(item => (
                    <ActionCard key={item.id} item={item} agentMap={agentMap} onUpdateStatus={updateStatus} />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 mb-4">No action items from this meeting</p>
              )}

              {/* All other action items collapsed */}
              {otherActions.length > 0 && (
                <details className="group">
                  <summary className="text-[11px] text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                    {otherActions.length} other action items →
                  </summary>
                  <div className="space-y-2 mt-2">
                    {otherActions.map(item => (
                      <ActionCard key={item.id} item={item} agentMap={agentMap} onUpdateStatus={updateStatus} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ item, agentMap, onUpdateStatus }: {
  item: ActionItem;
  agentMap: Record<string, Agent>;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const agent = agentMap[item.assignee] || agentMap[item.assignee?.toLowerCase()];
  const statusColors: Record<string, string> = {
    "new": "border-l-zinc-400",
    "in-progress": "border-l-blue-500",
    "done": "border-l-emerald-500",
    "blocked": "border-l-red-500",
  };

  return (
    <div className={`p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-2 ${statusColors[item.status] || "border-l-zinc-400"} bg-zinc-50 dark:bg-zinc-800/50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {agent?.emoji ? (
            <AgentIcon emoji={agent.emoji} size={12} />
          ) : (
            <HelpCircle size={12} className="text-zinc-400" />
          )}
          <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            @{agent?.name || item.assignee}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[item.priority] || "bg-zinc-400"}`} />
        </div>
        <div className="flex items-center gap-2">
          {item.status === "new" && (
            <button onClick={() => onUpdateStatus(item.id, "in-progress")} className="text-[10px] text-blue-500 hover:underline">
              Start →
            </button>
          )}
          {item.status === "in-progress" && (
            <button onClick={() => onUpdateStatus(item.id, "done")} className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5">
              Done <Check size={10} />
            </button>
          )}
          {item.status === "blocked" && (
            <button onClick={() => onUpdateStatus(item.id, "new")} className="text-[10px] text-amber-500 hover:underline">
              Unblock
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1">{item.task}</p>
      {item.outcome && (
        <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-0.5">
          <CheckCircle size={10} /> {item.outcome}
        </p>
      )}
      {item.blockedBy && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-0.5">
          <XCircle size={10} /> {item.blockedBy}
        </p>
      )}
    </div>
  );
}

function MeetingContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-3">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.includes(":**")) {
          const [speaker, ...rest] = line.split(":**");
          return (
            <div key={i} className="mt-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{speaker.replace(/\*\*/g, "")}:</span>
              <span className="text-zinc-700 dark:text-zinc-300 text-xs"> {rest.join(":**")}</span>
            </div>
          );
        }
        if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-1.5 text-xs"><Square size={11} className="text-zinc-400" /><span className="text-zinc-700 dark:text-zinc-300">{line.slice(6)}</span></div>;
        if (line.startsWith("- [x] ")) return <div key={i} className="flex items-center gap-1.5 text-xs"><CheckSquare size={11} className="text-green-600" /><span className="text-zinc-500 line-through">{line.slice(6)}</span></div>;
        if (line.startsWith("- ")) return <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 pl-3">• {line.slice(2)}</div>;
        if (line.startsWith("---")) return <hr key={i} className="border-zinc-200 dark:border-zinc-800 my-3" />;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs text-zinc-700 dark:text-zinc-300">{line}</p>;
      })}
    </div>
  );
}
