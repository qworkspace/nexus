"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

interface Business {
  name: string;
  status: "healthy" | "attention" | "critical";
  metrics: Metric[];
  nextActions: string[];
  lastUpdate: Date;
}

const BUSINESSES: Business[] = [
  {
    name: "IHV",
    status: "healthy",
    metrics: [
      { label: "Users", value: "1,234", trend: "up" },
      { label: "Revenue", value: "$12.4k", trend: "up" },
      { label: "Conversion", value: "3.2%", trend: "up" },
    ],
    nextActions: [
      "Review monthly report",
      "Plan feature roadmap",
    ],
    lastUpdate: new Date(Date.now() - 3600000),
  },
  {
    name: "Cohera",
    status: "attention",
    metrics: [
      { label: "Users", value: "89", trend: "up" },
      { label: "Revenue", value: "$890", trend: "neutral" },
      { label: "Conversion", value: "2.8%", trend: "down" },
    ],
    nextActions: [
      "Optimize onboarding flow",
      "Address pricing concerns",
    ],
    lastUpdate: new Date(Date.now() - 7200000),
  },
  {
    name: "CryptoMon",
    status: "healthy",
    metrics: [
      { label: "Trades", value: "45", trend: "up" },
      { label: "Profit", value: "+$234", trend: "up" },
      { label: "Win Rate", value: "68%", trend: "neutral" },
    ],
    nextActions: [
      "Review new strategy",
      "Backtest parameters",
    ],
    lastUpdate: new Date(Date.now() - 1800000),
  },
];

const getStatusColor = (status: string): string => {
  switch (status) {
    case "healthy":
      return "bg-zinc-500";
    case "attention":
      return "bg-yellow-500";
    case "critical":
      return "bg-zinc-500";
    default:
      return "bg-zinc-400";
  }
};

const getStatusDot = (status: string): JSX.Element => {
  switch (status) {
    case "healthy":
      return <Circle size={8} className="fill-[#F5D547] text-zinc-500" />;
    case "attention":
      return <Circle size={8} className="fill-yellow-500 text-yellow-500" />;
    case "critical":
      return <Circle size={8} className="fill-zinc-500 text-zinc-500" />;
    default:
      return <Circle size={8} className="fill-zinc-400 text-zinc-400" />;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTrendIcon = (trend?: string): string => {
  switch (trend) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    default:
      return "→";
  }
};

const getTrendColor = (trend?: string): string => {
  switch (trend) {
    case "up":
      return "text-zinc-900";
    case "down":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
};

export function BusinessHealthCards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">BUSINESS HEALTH</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {BUSINESSES.map((business) => (
            <div
              key={business.name}
              className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(business.status)}`} />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {business.name}
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {getStatusDot(business.status)}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {business.metrics.map((metric) => (
                  <div key={metric.label} className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</p>
                    <p className={`text-sm font-semibold ${getTrendColor(metric.trend)}`}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Next Actions */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Next Actions:
                </p>
                <ul className="space-y-0.5">
                  {business.nextActions.slice(0, 2).map((action) => (
                    <li key={action} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
