"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import useSWR from "swr";

interface CostByService {
  service: string;
  cost: number;
  count: number;
}

interface CostByModel {
  model: string;
  cost: number;
  count: number;
  inputTokens: number;
  outputTokens: number;
}

interface CostSummary {
  period: string;
  total: number;
  byService: CostByService[];
  byModel: CostByModel[];
  trend: number;
  previousPeriodTotal: number;
}

interface CostTrackerResponse {
  data?: CostSummary;
  error?: string;
}

async function fetcher(url: string): Promise<CostTrackerResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Budget configuration (could be made configurable)
const BUDGETS = {
  daily: 10.00,
  weekly: 50.00,
  monthly: 150.00,
} as const;

const getBudgetAlert = (current: number, budget: number): {
  level: "ok" | "warning" | "critical";
  percentage: number;
  message: string;
} => {
  const percentage = (current / budget) * 100;

  if (percentage >= 100) {
    return {
      level: "critical",
      percentage,
      message: "Budget exceeded!",
    };
  }

  if (percentage >= 80) {
    return {
      level: "warning",
      percentage,
      message: "Approaching budget limit",
    };
  }

  return {
    level: "ok",
    percentage,
    message: "Within budget",
  };
};

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

export function CostTracker() {
  const { data, error, isLoading } = useSWR<CostTrackerResponse>(
    '/api/costs/summary?period=day',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const summary = data?.data;
  const total = summary?.total || 0;

  // Calculate budget alerts for different periods
  const dailyAlert = getBudgetAlert(total, BUDGETS.daily);
  const weeklyAlert = getBudgetAlert(total * 7, BUDGETS.weekly);
  const monthlyAlert = getBudgetAlert(total * 30, BUDGETS.monthly);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">COST TRACKER</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Loading cost data...
          </div>
        ) : error || !summary ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error loading cost data
          </div>
        ) : (
          <div className="space-y-5">
            {/* Main Total */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Today&apos;s Total</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(total)}
                  </p>
                  {summary.trend !== 0 && (
                    <div className={`flex items-center text-sm font-medium ${
                      summary.trend > 0 ? "text-zinc-500" : "text-zinc-900"
                    }`}>
                      {summary.trend > 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(summary.trend).toFixed(1)}% vs yesterday
                    </div>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>

            {/* Budget Alerts */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Budget Status
              </p>

              {/* Daily Budget */}
              <BudgetProgressBar
                label="Daily"
                current={total}
                budget={BUDGETS.daily}
                alert={dailyAlert}
              />

              {/* Weekly Budget (estimated) */}
              <BudgetProgressBar
                label="Weekly (est.)"
                current={total * 7}
                budget={BUDGETS.weekly}
                alert={weeklyAlert}
              />

              {/* Monthly Budget (estimated) */}
              <BudgetProgressBar
                label="Monthly (est.)"
                current={total * 30}
                budget={BUDGETS.monthly}
                alert={monthlyAlert}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Yesterday&apos;s</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(summary.previousPeriodTotal)}
                </p>
              </div>
              <div className="text-center border-l border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">API Calls</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {summary.byService.reduce((sum, s) => sum + s.count, 0)}
                </p>
              </div>
              <div className="text-center border-l border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Services</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {summary.byService.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BudgetProgressBarProps {
  label: string;
  current: number;
  budget: number;
  alert: {
    level: "ok" | "warning" | "critical";
    percentage: number;
    message: string;
  };
}

function BudgetProgressBar({ label, current, budget, alert }: BudgetProgressBarProps) {
  const clampedPercentage = Math.min(alert.percentage, 100);

  const getStatusColor = (level: string): string => {
    switch (level) {
      case "critical":
        return "bg-zinc-500";
      case "warning":
        return "bg-zinc-500";
      default:
        return "bg-zinc-500";
    }
  };

  const getStatusBg = (level: string): string => {
    switch (level) {
      case "critical":
        return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
      case "warning":
        return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
      default:
        return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getStatusIcon = (level: string): JSX.Element => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-3 w-3 text-zinc-500" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-zinc-400" />;
      default:
        return <CheckCircle className="h-3 w-3 text-zinc-500" />;
    }
  };

  return (
    <div className={`p-2 rounded-lg border ${getStatusBg(alert.level)}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {getStatusIcon(alert.level)}
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
        </div>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {formatCurrency(current)} / {formatCurrency(budget)}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStatusColor(alert.level)} transition-all duration-500`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <p className={`text-[10px] mt-1 ${
        alert.level === "critical" ? "text-zinc-500 dark:text-zinc-400" :
        alert.level === "warning" ? "text-zinc-500 dark:text-zinc-400" :
        "text-zinc-900 dark:text-zinc-400"
      }`}>
        {alert.message} ({alert.percentage.toFixed(0)}%)
      </p>
    </div>
  );
}
