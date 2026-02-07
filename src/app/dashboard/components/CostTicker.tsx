"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCosts } from "../hooks/useCosts";

export function CostTicker() {
  const { costs, formatCurrency, getProgressColor } = useCosts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">TODAY&apos;S COSTS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cost Display with Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-zinc-900">
                {formatCurrency(costs.today)}
              </span>
              <span className="text-xs text-zinc-500">today</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-zinc-200 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(costs.budgetPercent)}`}
                style={{ width: `${costs.budgetPercent}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>
                {costs.budgetPercent}% of {formatCurrency(costs.budget)} budget
              </span>
              <span className={costs.withinBudget ? "text-green-600" : "text-red-600"}>
                {costs.withinBudget ? "✓" : "⚠"}
              </span>
            </div>
          </div>

          {/* Breakdown by Model */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 mb-2">BY MODEL</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Opus</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byModel.opus)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Sonnet</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byModel.sonnet)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">GLM</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byModel.glm)}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown by Agent */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 mb-2">BY AGENT</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Q</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byAgent.Q)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Dev</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byAgent.Dev)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Others</span>
                <span className="text-zinc-900 font-medium">
                  {formatCurrency(costs.breakdown.byAgent.others)}
                </span>
              </div>
            </div>
          </div>

          {/* Projection */}
          <div className="pt-3 border-t border-zinc-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Projection by midnight:</span>
              <span className={`font-semibold ${costs.withinBudget ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(costs.projection)}
              </span>
            </div>
            <p className={`text-xs mt-1 ${costs.withinBudget ? "text-green-600" : "text-red-600"}`}>
              {costs.withinBudget ? "✓ within budget" : "⚠ exceeds budget"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
