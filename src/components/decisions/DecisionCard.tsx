"use client";

import { useState } from "react";
import { Decision } from "@/types/decision";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DecisionCardProps {
  decision: Decision;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = confidence * 100;
  let barColor = "bg-red-500";
  if (percentage >= 80) barColor = "bg-zinc-800";
  else if (percentage >= 60) barColor = "bg-yellow-500";
  else if (percentage >= 40) barColor = "bg-[#FFE135]";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-10">{percentage.toFixed(0)}%</span>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome?: Decision["outcome"] }) {
  if (!outcome) {
    return (
      <Badge className="bg-zinc-100 text-[#FFE135] hover:bg-zinc-100 border-zinc-300">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  }

  if (outcome.matched) {
    return (
      <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
      <XCircle className="h-3 w-3 mr-1" />
      Failed
    </Badge>
  );
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const timestamp = new Date(decision.timestamp * 1000);
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
      {/* Header - always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Expand/collapse icon */}
            <button className="mt-0.5 text-zinc-400 hover:text-zinc-600">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            <div className="flex-1 min-w-0">
              {/* Action name and agent */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-zinc-900">
                  {decision.decision.action}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {decision.agent}
                </Badge>
              </div>

              {/* Timestamp */}
              <p className="text-sm text-zinc-500">{relativeTime}</p>
            </div>
          </div>

          {/* Right side: confidence + outcome */}
          <div className="flex items-center gap-4 shrink-0">
            <ConfidenceBar confidence={decision.decision.confidence} />
            <OutcomeBadge outcome={decision.outcome} />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-zinc-100">
          <div className="mt-4 space-y-4">
            {/* Observations */}
            {decision.reasoning.observations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Observations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">
                  {decision.reasoning.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Context */}
            {Object.keys(decision.context).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Context</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(decision.context).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Parameters */}
            {Object.keys(decision.decision.parameters).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Parameters</h4>
                <pre className="text-xs bg-zinc-50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(decision.decision.parameters, null, 2)}
                </pre>
              </div>
            )}

            {/* Outcome details */}
            {decision.outcome && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Outcome</h4>
                <div className="bg-zinc-50 p-3 rounded-lg space-y-2 text-sm">
                  <p>
                    <span className="text-zinc-500">Result:</span>{" "}
                    <span className="text-zinc-700">{decision.outcome.actual}</span>
                  </p>
                  {decision.outcome.feedback && (
                    <p>
                      <span className="text-zinc-500">Feedback:</span>{" "}
                      <span className="text-zinc-700">{decision.outcome.feedback}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {decision.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">Tags:</span>
                {decision.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Full timestamp */}
            <p className="text-xs text-zinc-400">
              {timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
