"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import useSWR from "swr";

interface Service {
  name: string;
  status: "running" | "stopped" | "unknown";
  uptime?: number;
  lastCheck: string;
}

interface HealthResponse {
  services: Service[];
  timestamp: string;
}

interface ServiceStatusResponse {
  data?: HealthResponse;
  error?: string;
}

async function fetcher(url: string): Promise<ServiceStatusResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

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

const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case "running":
      return <CheckCircle className="h-4 w-4 text-zinc-500" />;
    case "stopped":
      return <XCircle className="h-4 w-4 text-zinc-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-zinc-400" />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "running":
      return "text-zinc-900 dark:text-zinc-400";
    case "stopped":
      return "text-zinc-500 dark:text-zinc-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
};

const getStatusBg = (status: string): string => {
  switch (status) {
    case "running":
      return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
    case "stopped":
      return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
    default:
      return "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
  }
};

export function ServiceStatus() {
  const { data, error, isLoading } = useSWR<ServiceStatusResponse>(
    "/api/health/services",
    fetcher,
    {
      refreshInterval: 10000, // 10-second refresh
      revalidateOnFocus: false,
    }
  );

  const services = data?.data?.services || [];
  const allRunning = services.every((s) => s.status === "running");
  const anyStopped = services.some((s) => s.status === "stopped");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ActivityIcon allRunning={allRunning} anyStopped={anyStopped} />
          SERVICES
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Checking services...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            Error checking services
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            No services configured
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceItem key={service.name} service={service} />
            ))}

            {/* Overall Status */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className={`flex items-center justify-between p-2 rounded-lg border ${getStatusBg(allRunning ? "running" : "stopped")}`}>
                <div className="flex items-center gap-2">
                  {allRunning ? (
                    <CheckCircle className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Overall Status
                  </span>
                </div>
                <span className={`text-xs font-semibold ${getStatusColor(allRunning ? "running" : "stopped")}`}>
                  {allRunning ? "All Systems Go" : "Attention Needed"}
                </span>
              </div>
            </div>

            {/* Last Check */}
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Clock className="h-3 w-3" />
                <span>
                  Last check: {data?.data ? new Date(data.data.timestamp).toLocaleTimeString() : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityIconProps {
  allRunning: boolean;
  anyStopped: boolean;
}

function ActivityIcon({ allRunning, anyStopped }: ActivityIconProps) {
  if (allRunning) {
    return <CheckCircle className="h-5 w-5 text-zinc-500" />;
  }
  if (anyStopped) {
    return <XCircle className="h-5 w-5 text-zinc-500" />;
  }
  return <AlertCircle className="h-5 w-5 text-zinc-400" />;
}

interface ServiceItemProps {
  service: Service;
}

function ServiceItem({ service }: ServiceItemProps) {
  return (
    <div className={`p-3 rounded-lg border ${getStatusBg(service.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(service.status)}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {service.name}
          </span>
        </div>
        <span className={`text-xs font-semibold ${getStatusColor(service.status)} capitalize`}>
          {service.status}
        </span>
      </div>

      {service.uptime !== undefined && service.status === "running" && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Uptime
          </span>
          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
            {formatUptime(service.uptime)}
          </span>
        </div>
      )}
    </div>
  );
}
