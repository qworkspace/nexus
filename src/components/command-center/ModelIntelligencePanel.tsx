"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useCommandStore } from "@/stores/commandStore";
import { Zap, Brain, Sparkles, Eye, Bot } from "lucide-react";

interface ModelUsage {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  requests: number;
}

interface ModelsUsageData {
  source: string;
  currentModel: string;
  usage: ModelUsage[];
  totalCost: number;
  recommendations: { message: string; model: string; reason: string }[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const modelIcons: Record<string, JSX.Element> = {
  'claude-opus-4-5': <Brain size={20} />,
  'claude-sonnet-4': <Sparkles size={20} />,
  'claude-3-5-sonnet': <Sparkles size={20} />,
  'claude-3-5-haiku': <Zap size={20} />,
  'glm-4-flash': <Eye size={20} />,
  'gpt-4o': <Bot size={20} />,
  'gpt-4o-mini': <Zap size={20} />,
};

const modelColors: Record<string, string> = {
  'claude-opus-4-5': 'bg-purple-500',
  'claude-sonnet-4': 'bg-foreground',
  'claude-3-5-sonnet': 'bg-foreground',
  'claude-3-5-haiku': 'bg-green-500',
  'glm-4-flash': 'bg-[#FFE135]',
  'gpt-4o': 'bg-[#FFE135]',
  'gpt-4o-mini': 'bg-teal-500',
};

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return String(tokens);
}

function formatModelName(model: string): string {
  return model
    .replace('claude-', '')
    .replace('anthropic/', '')
    .replace('-4-5', ' 4.5')
    .replace('-4', ' 4')
    .replace('-3-5', ' 3.5');
}

export function ModelIntelligencePanel() {
  const { data, isLoading } = useSWR<ModelsUsageData>(
    "/api/models/usage",
    fetcher,
    { refreshInterval: 10000 }
  );
  const { openModel } = useCommandStore();

  const maxTokens = Math.max(...(data?.usage.map(u => u.tokensIn + u.tokensOut) || [1]));

  return (
    <Card className="dark:glass-panel">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap size={16} />
          Model Intelligence
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={openModel}
          className="text-[10px] h-7 px-2"
        >
          Switch
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Model */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-card/80 border dark:border-border">
          <span className="text-muted-foreground dark:text-muted-foreground">
            {modelIcons[data?.currentModel || ''] || <Bot size={20} />}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-foreground">
                {formatModelName(data?.currentModel || 'Loading...')}
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Active
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Current session model</span>
          </div>
        </div>

        {/* Token Usage by Model */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Today&apos;s Usage
            </h4>
            <span className="text-sm font-semibold text-zinc-900 dark:text-foreground">
              ${data?.totalCost.toFixed(2) || '0.00'}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-secondary shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.usage.map(model => {
                const totalTokens = model.tokensIn + model.tokensOut;
                const percentage = (totalTokens / maxTokens) * 100;
                const color = modelColors[model.model] || 'bg-zinc-500';
                
                return (
                  <div key={model.model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{modelIcons[model.model] || <Bot size={16} />}</span>
                        <span className="text-zinc-700 dark:text-foreground">
                          {formatModelName(model.model)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{model.requests} reqs</span>
                        <span className="font-mono">
                          ${model.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {formatTokens(totalTokens)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {data?.recommendations && data?.recommendations?.length > 0 && (
          <div className="space-y-2 pt-2 border-t dark:border-border">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recommendations
            </h4>
            {(data?.recommendations || []).slice(0, 2).map((rec, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 rounded-lg text-sm",
                  rec.model
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30"
                )}
              >
                <p className={cn(
                  "font-medium",
                  rec.model ? "text-blue-700 dark:text-foreground" : "text-green-700 dark:text-green-400"
                )}>
                  {rec.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
