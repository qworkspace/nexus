"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, HardDrive, Activity, Clock } from "lucide-react";
import useSWR from "swr";

interface CpuInfo {
  usage: number;
  cores: number;
  model: string;
}

interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  usage: number;
}

interface DiskInfo {
  total: number;
  free: number;
  used: number;
  usage: number;
}

interface SystemMetricsData {
  cpu: CpuInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  uptime: number;
  timestamp: string;
}

interface SystemMetricsResponse {
  data?: SystemMetricsData;
  error?: string;
}

async function fetcher(url: string): Promise<SystemMetricsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const formatBytes = (gb: number): string => {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(2)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getUsageColor = (usage: number): string => {
  if (usage >= 90) return "text-zinc-500 dark:text-zinc-400";
  if (usage >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-zinc-900 dark:text-zinc-400";
};

const getUsageBg = (usage: number): string => {
  if (usage >= 90) return "bg-zinc-500";
  if (usage >= 70) return "bg-yellow-500";
  return "bg-zinc-500";
};

export function SystemMetrics() {
  const { data, error, isLoading } = useSWR<SystemMetricsResponse>(
    "/api/health/system",
    fetcher,
    {
      refreshInterval: 5000, // 5-second refresh
      revalidateOnFocus: false,
    }
  );

  const metrics = data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          SYSTEM METRICS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Loading metrics...
          </div>
        ) : error || !metrics ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error loading metrics
          </div>
        ) : (
          <div className="space-y-4">
            {/* CPU */}
            <MetricCard
              title="CPU"
              value={`${metrics.cpu.usage.toFixed(1)}%`}
              subtitle={`${metrics.cpu.cores} cores`}
              usage={metrics.cpu.usage}
              icon={<Cpu className="h-4 w-4" />}
            />

            {/* Memory */}
            <MetricCard
              title="Memory"
              value={formatBytes(metrics.memory.used)}
              subtitle={`of ${formatBytes(metrics.memory.total)}`}
              usage={metrics.memory.usage}
              icon={<HardDrive className="h-4 w-4" />}
            />

            {/* Disk */}
            <MetricCard
              title="Disk"
              value={formatBytes(metrics.disk.used)}
              subtitle={`of ${formatBytes(metrics.disk.total)}`}
              usage={metrics.disk.usage}
              icon={<HardDrive className="h-4 w-4" />}
            />

            {/* Uptime */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>Uptime</span>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatUptime(metrics.uptime)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  usage: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, subtitle, usage, icon }: MetricCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            {icon}
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {title}
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getUsageBg(usage)} transition-all duration-500`}
          style={{ width: `${Math.min(usage, 100)}%` }}
        />
      </div>

      {/* Usage percentage with color */}
      <p className={`text-xs ${getUsageColor(usage)}`}>
        {usage.toFixed(1)}% used
      </p>
    </div>
  );
}
