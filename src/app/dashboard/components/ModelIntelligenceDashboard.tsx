"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Minus, RefreshCw, Zap } from "lucide-react";
import useSWR from "swr";

interface ModelUsage {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  requests: number;
}

interface ModelsUsageResponse {
  source: 'live' | 'mock' | 'error';
  currentModel: string;
  usage: ModelUsage[];
  totalCost: number;
  recommendations: { message: string; model: string; reason: string }[];
  error?: string;
}

async function fetcher(url: string): Promise<ModelsUsageResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const MODEL_LABELS: Record<string, string> = {
  'claude-opus-4-5': 'Opus 4.5',
  'claude-sonnet-4': 'Sonnet 4',
  'claude-3-5-sonnet': 'Sonnet 3.5',
  'claude-3-5-haiku': 'Haiku 3.5',
  'glm-4-flash': 'GLM-4 Flash',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
};

export function ModelIntelligenceDashboard() {
  const { data, isLoading } = useSWR<ModelsUsageResponse>(
    '/api/models/usage',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const currentModel = data?.currentModel || 'claude-opus-4-5';
  const usage = data?.usage || [];
  const totalCost = data?.totalCost || 0;
  const recommendations = data?.recommendations || [];

  const getModelLabel = (model: string): string => {
    return MODEL_LABELS[model] || model;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  const getModelBadgeColor = (model: string): string => {
    if (model.includes('opus')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    if (model.includes('sonnet')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    if (model.includes('haiku')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    if (model.includes('glm')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    if (model.includes('gpt')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  const getRecommendationIcon = (type: string) => {
    if (type.includes('switch') || type.includes('consider')) {
      return <RefreshCw className="h-4 w-4" />;
    }
    if (type.includes('high') || type.includes('free')) {
      return <Zap className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">MODEL INTELLIGENCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
            <div className="h-24 bg-zinc-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">MODEL INTELLIGENCE</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Model */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Current Model</p>
              <Badge className={getModelBadgeColor(currentModel)}>
                {getModelLabel(currentModel)}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {/* Open model switcher */}}
            >
              Switch <ArrowDown className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Today's Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-zinc-500">
                Today&apos;s Usage
              </p>
              <Badge variant="outline" className="text-xs">
                {formatCost(totalCost)}
              </Badge>
            </div>
            <div className="space-y-2">
              {usage.map((model) => (
                <div
                  key={model.model}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getModelBadgeColor(model.model)}`}>
                      {getModelLabel(model.model)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-600">
                      {formatTokens(model.tokensIn + model.tokensOut)} tokens
                    </p>
                    <p className="text-xs font-semibold text-zinc-900">
                      {formatCost(model.cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="pt-3 border-t border-zinc-200">
              <div className="flex items-center gap-1 mb-2">
                <Zap className="h-3 w-3 text-zinc-400" />
                <p className="text-xs font-medium text-zinc-500">
                  Recommendations
                </p>
              </div>
              <div className="space-y-2">
                {recommendations.slice(0, 2).map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-50 border border-zinc-200 rounded p-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 text-zinc-500">
                        {getRecommendationIcon(rec.message)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-900">
                          {rec.message}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
