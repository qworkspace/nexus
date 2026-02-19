"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { SystemMetrics } from "./SystemMetrics";
import { ServiceStatus } from "./ServiceStatus";
import useSWR from "swr";

interface SystemMetricsData {
  cpu: { usage: number };
  memory: { usage: number };
  disk: { usage: number };
}

interface Service {
  status: "running" | "stopped" | "unknown";
}

interface SystemData {
  cpu: SystemMetricsData["cpu"];
  memory: SystemMetricsData["memory"];
  disk: SystemMetricsData["disk"];
}

interface HealthResponse {
  services: Service[];
}

interface SystemResponse {
  data?: SystemData;
}

interface ServicesResponse {
  data?: HealthResponse;
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

interface Alert {
  type: "critical" | "warning" | "info";
  message: string;
  icon: React.ReactNode;
}

export function HealthMonitor() {
  const { data: systemData } = useSWR<SystemResponse>("/api/health/system", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
  });

  const { data: servicesData } = useSWR<ServicesResponse>("/api/health/services", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });

  const metrics = systemData?.data;
  const services = servicesData?.data?.services || [];

  // Calculate alerts
  const alerts: Alert[] = [];

  if (metrics) {
    // CPU alerts
    if (metrics.cpu.usage >= 90) {
      alerts.push({
        type: "critical",
        message: `CPU usage at ${metrics.cpu.usage.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else if (metrics.cpu.usage >= 70) {
      alerts.push({
        type: "warning",
        message: `CPU usage elevated at ${metrics.cpu.usage.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    // Memory alerts
    if (metrics.memory.usage >= 90) {
      alerts.push({
        type: "critical",
        message: `Memory usage at ${metrics.memory.usage.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else if (metrics.memory.usage >= 80) {
      alerts.push({
        type: "warning",
        message: `Memory usage elevated at ${metrics.memory.usage.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    // Disk alerts
    if (metrics.disk.usage >= 90) {
      alerts.push({
        type: "critical",
        message: `Disk usage at ${metrics.disk.usage.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else if (metrics.disk.usage >= 80) {
      alerts.push({
        type: "warning",
        message: `Disk space low: ${metrics.disk.usage.toFixed(1)}% used`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }
  }

  // Service alerts
  const stoppedServices = services.filter((s) => s.status === "stopped");
  if (stoppedServices.length > 0) {
    alerts.push({
      type: "critical",
      message: `${stoppedServices.length} service(s) down`,
      icon: <AlertTriangle className="h-4 w-4" />,
    });
  }

  const unknownServices = services.filter((s) => s.status === "unknown");
  if (unknownServices.length > 0) {
    alerts.push({
      type: "warning",
      message: `${unknownServices.length} service(s) status unknown`,
      icon: <AlertTriangle className="h-4 w-4" />,
    });
  }

  // Overall status
  const allHealthy = alerts.length === 0;
  const hasCritical = alerts.some((a) => a.type === "critical");

  return (
    <div className="col-span-12 lg:col-span-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className={`h-5 w-5 ${allHealthy ? "text-zinc-500" : hasCritical ? "text-zinc-500" : "text-yellow-500"}`} />
            HEALTH MONITOR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-4 space-y-2">
              {alerts.map((alert, index) => (
                <AlertBadge key={index} alert={alert} />
              ))}
            </div>
          )}

          {/* All healthy message */}
          {alerts.length === 0 && (
            <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  All systems healthy
                </span>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <SystemMetrics />
            <ServiceStatus />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AlertBadgeProps {
  alert: Alert;
}

function AlertBadge({ alert }: AlertBadgeProps) {
  const getStyles = (type: string) => {
    switch (type) {
      case "critical":
        return {
          bg: "bg-zinc-50 dark:bg-zinc-950",
          border: "border-zinc-200 dark:border-zinc-800",
          text: "text-zinc-800 dark:text-zinc-200",
          icon: "text-zinc-500",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: "text-yellow-500",
        };
      default:
        return {
          bg: "bg-zinc-50 dark:bg-zinc-950",
          border: "border-zinc-200 dark:border-zinc-800",
          text: "text-zinc-800 dark:text-zinc-200",
          icon: "text-zinc-500",
        };
    }
  };

  const styles = getStyles(alert.type);

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
      <span className={styles.icon}>{alert.icon}</span>
      <span className={`text-sm font-medium ${styles.text}`}>
        {alert.message}
      </span>
    </div>
  );
}
