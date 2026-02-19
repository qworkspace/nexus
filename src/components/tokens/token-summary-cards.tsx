"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TokenPeriodSummary } from "@/lib/tokens/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TokenSummaryCardsProps {
  today: TokenPeriodSummary;
  yesterday: TokenPeriodSummary;
  thisWeek: TokenPeriodSummary;
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

const formatPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return ((value / total) * 100);
};

export function TokenSummaryCards({ today, yesterday, thisWeek }: TokenSummaryCardsProps) {
  // Calculate change vs yesterday
  const tokenChange = formatPercentage(today.totalTokens - yesterday.totalTokens, yesterday.totalTokens || 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Today Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-zinc-900">
              {formatTokens(today.totalTokens)}
            </p>
            <p className="text-sm text-muted-foreground">
              tokens
            </p>
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {formatCost(today.totalCost)}
          </p>
          {yesterday.totalTokens > 0 && (
            <div className={`flex items-center text-xs mt-2 ${
              tokenChange >= 0 ? "text-zinc-500" : "text-zinc-900"
            }`}>
              {tokenChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(tokenChange).toFixed(1)}% vs yesterday
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yesterday Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Yesterday
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-zinc-900">
              {formatTokens(yesterday.totalTokens)}
            </p>
            <p className="text-sm text-muted-foreground">
              tokens
            </p>
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {formatCost(yesterday.totalCost)}
          </p>
        </CardContent>
      </Card>

      {/* This Week Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-zinc-900">
              {formatTokens(thisWeek.totalTokens)}
            </p>
            <p className="text-sm text-muted-foreground">
              tokens
            </p>
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {formatCost(thisWeek.totalCost)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
