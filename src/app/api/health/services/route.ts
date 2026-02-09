import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "unknown";
  uptime?: number;
  lastCheck: string;
}

interface HealthResponse {
  services: ServiceStatus[];
  timestamp: string;
}

// Services to check
const SERVICES = [
  { name: "OpenClaw", process: "openclaw" },
  { name: "Luna", process: "luna" },
  { name: "Content Pipeline", process: "pipeline" },
];

async function checkServiceStatus(serviceName: string, processName: string): Promise<ServiceStatus> {
  try {
    // Check if process is running using pgrep
    try {
      execSync(`pgrep -f "${processName}"`, { stdio: "ignore" });

      // Try to get uptime using ps
      let uptime: number | undefined;
      try {
        const psOutput = execSync(`ps -eo pid,etime,comm | grep -i "${processName}" | head -1`, {
          encoding: "utf-8",
        });
        const parts = psOutput.trim().split(/\s+/);
        if (parts.length >= 2) {
          // Parse etime format (e.g., "1-23:45:67" or "12:34:56" or "123:45")
          const etime = parts[1];
          uptime = parseEtime(etime);
        }
      } catch {
        // Couldn't get uptime, but service is running
      }

      return {
        name: serviceName,
        status: "running",
        uptime,
        lastCheck: new Date().toISOString(),
      };
    } catch {
      // Process not found
      return {
        name: serviceName,
        status: "stopped",
        lastCheck: new Date().toISOString(),
      };
    }
  } catch {
    // Error checking service - return unknown status
    return {
      name: serviceName,
      status: "unknown",
      lastCheck: new Date().toISOString(),
    };
  }
}

// Parse ps etime format to seconds
function parseEtime(etime: string): number {
  try {
    // Format: [[dd-]hh:]mm:ss
    const parts = etime.split("-");

    if (parts.length === 2) {
      // Has days
      const days = parseInt(parts[0], 10);
      const timeParts = parts[1].split(":");
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2] || "0", 10);
      return days * 86400 + hours * 3600 + minutes * 60 + seconds;
    } else {
      // No days, format: hh:mm:ss or mm:ss
      const timeParts = parts[0].split(":");
      if (timeParts.length === 3) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        return hours * 3600 + minutes * 60 + seconds;
      } else if (timeParts.length === 2) {
        const minutes = parseInt(timeParts[0], 10);
        const seconds = parseInt(timeParts[1], 10);
        return minutes * 60 + seconds;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    // Check all services in parallel
    const servicePromises = SERVICES.map((service) =>
      checkServiceStatus(service.name, service.process)
    );

    const services = await Promise.all(servicePromises);

    const response: HealthResponse = {
      services,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching service status:", error);
    return NextResponse.json(
      { error: "Failed to fetch service status" },
      { status: 500 }
    );
  }
}
