import { NextResponse } from "next/server";
import * as os from "os";
import { execSync } from "child_process";

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  uptime: number;
  timestamp: string;
}

// CPU usage calculation
let previousCpuTimes = {
  user: 0,
  nice: 0,
  sys: 0,
  idle: 0,
  irq: 0,
};

function calculateCpuUsage(): number {
  const cpus = os.cpus();
  let totalUser = 0;
  let totalNice = 0;
  let totalSys = 0;
  let totalIdle = 0;
  let totalIrq = 0;

  for (const cpu of cpus) {
    totalUser += cpu.times.user;
    totalNice += cpu.times.nice;
    totalSys += cpu.times.sys;
    totalIdle += cpu.times.idle;
    totalIrq += cpu.times.irq;
  }

  const currentTotal = totalUser + totalNice + totalSys + totalIdle + totalIrq;
  const previousTotal = previousCpuTimes.user + previousCpuTimes.nice + previousCpuTimes.sys + previousCpuTimes.idle + previousCpuTimes.irq;

  let usage = 0;

  if (previousTotal > 0) {
    const totalDiff = currentTotal - previousTotal;
    const idleDiff = totalIdle - previousCpuTimes.idle;

    usage = 100 - (idleDiff / totalDiff) * 100;
  }

  // Update previous values
  previousCpuTimes = {
    user: totalUser,
    nice: totalNice,
    sys: totalSys,
    idle: totalIdle,
    irq: totalIrq,
  };

  return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
}

// Get disk usage
function getDiskUsage(): { total: number; free: number; used: number; usage: number } {
  try {
    // Get home directory
    const homeDir = os.homedir();

    // Try to get disk space using df command on macOS/Linux

    try {
      const output = execSync(`df -k "${homeDir}"`, { encoding: "utf-8" });
      const lines = output.trim().split("\n");

      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const totalKb = parseInt(parts[1], 10);
        const usedKb = parseInt(parts[2], 10);
        const freeKb = parseInt(parts[3], 10);

        return {
          total: Math.round((totalKb * 1024) / 1024 / 1024 / 1024 * 100) / 100, // TB
          used: Math.round((usedKb * 1024) / 1024 / 1024 / 1024 * 100) / 100,    // TB
          free: Math.round((freeKb * 1024) / 1024 / 1024 / 1024 * 100) / 100,    // TB
          usage: Math.round((usedKb / totalKb) * 100 * 10) / 10,
        };
      }
    } catch (e) {
      // Fallback if df command fails
      console.error("Failed to get disk usage:", e);
    }

    // Fallback - return zeros if we can't get disk info
    return {
      total: 0,
      free: 0,
      used: 0,
      usage: 0,
    };
  } catch (error) {
    console.error("Error getting disk usage:", error);
    return {
      total: 0,
      free: 0,
      used: 0,
      usage: 0,
    };
  }
}

export async function GET() {
  try {
    // Get CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Unknown";
    const cpuUsage = calculateCpuUsage();

    // Get memory info (in GB)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk info
    const diskUsage = getDiskUsage();

    const metrics: SystemMetrics = {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpuModel,
      },
      memory: {
        total: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
        free: Math.round((freeMem / 1024 / 1024 / 1024) * 100) / 100,
        used: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
        usage: Math.round((usedMem / totalMem) * 100 * 10) / 10,
      },
      disk: diskUsage,
      uptime: os.uptime(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch system metrics" },
      { status: 500 }
    );
  }
}
