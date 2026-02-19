"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

interface DailyCost {
  date: string;
  total: number;
  byService: Record<string, number>;
  byModel: Record<string, number>;
  tokensIn: number;
  tokensOut: number;
  activityCount: number;
}

interface CostHistory {
  daily: DailyCost[];
  summary: {
    total: number;
    avgDaily: number;
    highestDay: { date: string; cost: number } | null;
    totalTokensIn: number;
    totalTokensOut: number;
  };
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface CostTrendResponse {
  data?: CostHistory;
  error?: string;
}

async function fetcher(url: string): Promise<CostTrendResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split("T")[0];
};

export function CostTrend() {
  const { data, error, isLoading } = useSWR<CostTrendResponse>(
    '/api/costs/history?days=14',
    fetcher,
    {
      refreshInterval: 60000, // 1-minute refresh
      revalidateOnFocus: false,
    }
  );

  const history = data?.data;
  const daily = history?.daily || [];
  const summary = history?.summary;

  // Find max value for scaling
  const maxValue = Math.max(...daily.map((d) => d.total), 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">COST TREND</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Loading trend data...
          </div>
        ) : error || !history ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error loading trend data
          </div>
        ) : daily.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            No cost data available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    14-Day Total
                  </p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    ${summary.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Avg Daily
                  </p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    ${summary.avgDaily.toFixed(2)}
                  </p>
                </div>
                {summary.highestDay && (
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Highest Day
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      ${summary.highestDay.cost.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(summary.highestDay.date)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Total Tokens
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {((summary.totalTokensIn + summary.totalTokensOut) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-zinc-500">
                    {((summary.totalTokensIn / (summary.totalTokensIn + summary.totalTokensOut)) * 100).toFixed(0)}% in
                  </p>
                </div>
              </div>
            )}

            {/* Bar Chart */}
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                Daily Costs (Last 14 Days)
              </p>
              <div className="relative h-[160px] flex items-end gap-1">
                {daily.slice().reverse().map((day) => {
                  const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
                  const isToday = day.date === getTodayDate();
                  const isWeekend = new Date(day.date).getDay() === 0 ||
                    new Date(day.date).getDay() === 6;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div className="relative w-full">
                        <div
                          className={`
                            w-full rounded-t transition-all duration-300
                            ${isToday ? 'bg-zinc-500' : isWeekend ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-zinc-500 dark:bg-zinc-500'}
                            hover:opacity-80
                          `}
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                          <div className="font-medium">${day.total.toFixed(2)}</div>
                          <div className="text-zinc-300">{formatDate(day.date)}</div>
                        </div>
                      </div>
                      {/* Date label for first, last, and today */}
                      {day.date === daily[0].date || day.date === daily[daily.length - 1].date || isToday ? (
                        <span className={`text-[10px] mt-1 ${isToday ? 'font-semibold text-zinc-500 dark:text-zinc-400' : 'text-zinc-400'}`}>
                          {formatDate(day.date)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {/* Y-axis labels */}
              <div className="absolute -left-6 top-0 h-[160px] flex flex-col justify-between text-[10px] text-zinc-400">
                <span>${maxValue.toFixed(0)}</span>
                <span>${(maxValue / 2).toFixed(0)}</span>
                <span>$0</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
