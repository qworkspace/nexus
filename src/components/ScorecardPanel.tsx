"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { MetricTooltip } from "@/components/ui/tooltip";

interface ScorecardMetric {
  name: string;
  score: number;
  previousScore?: number;
  delta?: number;
}

interface ScorecardData {
  date: string;
  assessmentFile: string;
  overall: number;
  metrics: ScorecardMetric[];
}

interface ScorecardResponse {
  current: ScorecardData | null;
  previous: ScorecardData | null;
}

export default function ScorecardPanel() {
  const [data, setData] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const res = await fetch("/api/loops/scorecard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchScorecard();

    // Refresh every 5 minutes
    const interval = setInterval(fetchScorecard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground">
            Loop 0 Scorecard
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-100 dark:bg-secondary rounded w-3/4" />
          <div className="h-2 bg-zinc-100 dark:bg-secondary rounded w-full" />
          <div className="h-2 bg-zinc-100 dark:bg-secondary rounded w-full" />
          <div className="h-2 bg-zinc-100 dark:bg-secondary rounded w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground">
            Loop 0 Scorecard
          </h3>
        </div>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (!data?.current) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground">
            Loop 0 Scorecard
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">No assessment data available yet.</p>
      </div>
    );
  }

  const { current, previous } = data;

  return (
    <Card className="border-zinc-200 dark:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Loop 0 Scorecard</CardTitle>
          <Link
            href={`file:///Users/paulvillanueva/.openclaw/shared/research/self-improvement/${current.assessmentFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-zinc-700 dark:hover:text-foreground flex items-center gap-1"
          >
            <FileText size={10} />
            View Full
          </Link>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Assessment: {formatDate(current.date)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Score */}
        <div className="text-center pb-3 border-b border-zinc-100 dark:border-border">
          <div className="text-3xl font-bold text-emerald-600 dark:text-[#FFE135]">
            {current.overall.toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Overall</div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          {current.metrics.map((metric) => {
            const tooltipContent = getMetricTooltip(metric.name.toLowerCase());
            return (
              <MetricTooltip key={metric.name} content={tooltipContent}>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700 dark:text-foreground">
                      {metric.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {metric.delta !== undefined && (
                        <DeltaIndicator delta={metric.delta} />
                      )}
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-foreground">
                        {metric.score}/10
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={metric.score} max={10} />
                </div>
              </MetricTooltip>
            );
          })}
        </div>
      </CardContent>
      {previous && (
        <CardFooter className="pt-3 border-t border-zinc-100 dark:border-border">
          <p className="text-[10px] text-muted-foreground text-center w-full">
            Previous: {formatDate(previous.date)} — {previous.overall.toFixed(1)}/10
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = (value / max) * 100;
  let colorClass = "bg-foreground";
  
  if (value >= 8) colorClass = "bg-[#FFE135]";
  else if (value >= 6) colorClass = "bg-foreground";
  else if (value >= 4) colorClass = "bg-[#FFE135]";
  else colorClass = "bg-red-500";

  return (
    <div className="h-1.5 bg-zinc-100 dark:bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <TrendingUp size={12} className="text-foreground" aria-label={`+${delta} from previous`} />
    );
  } else if (delta < 0) {
    return (
      <TrendingDown size={12} className="text-red-500" aria-label={`${delta} from previous`} />
    );
  } else {
    return (
      <Minus size={12} className="text-muted-foreground" aria-label="no change" />
    );
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
}

function getMetricTooltip(metricName: string): string {
  const tooltips: Record<string, string> = {
    autonomy: "Can Q work independently without PJ hand-holding? Measures autonomous task completion rate.",
    quality: "Are outputs correct, verified, and useful? Measured by task acceptance rate and regression frequency.",
    speed: "How fast from task to delivered result? Average completion time across all tasks.",
    alignment: "Does Q build what PJ actually wants? Measured by PJ ratings and rework frequency.",
    energy: "Tone, vibe, proactive vs reactive. Subjective score from PJ feedback.",
  };
  return tooltips[metricName] || "Metric score tracking Q's performance.";
}
