import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

interface IdeaStatsResponse {
  total: number;
  new: number;
  approved: number;
  parked: number;
  rejected: number;
  specced: number;
  building: number;
  shipped: number;
  review: number;
  approvalRate: number;
  avgTimeToShip: string;
  successRate: number;
  completionRate: number;
}

export async function GET() {
  try {
    const statusMap = loadStatusMap();
    const stats = calculateStats(statusMap);

    return NextResponse.json(stats as IdeaStatsResponse);
  } catch (error) {
    console.error("Error fetching idea stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea stats" },
      { status: 500 }
    );
  }
}

function loadStatusMap(): Map<string, IdeaStatusEntry> {
  const map = new Map<string, IdeaStatusEntry>();

  if (!existsSync(STATUS_FILE)) {
    return map;
  }

  try {
    const content = readFileSync(STATUS_FILE, "utf-8");
    const data = JSON.parse(content);

    for (const [filename, entry] of Object.entries(data)) {
      map.set(filename, entry as IdeaStatusEntry);
    }
  } catch (error) {
    console.error("Error loading status map:", error);
  }

  return map;
}

interface IdeaStatusEntry {
  status: IdeaStatus;
  approvedAt?: string;
  specPath?: string;
  buildStatus?: IdeaStatus;
  buildId?: string;
  shippedAt?: string;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
}

function calculateStats(statusMap: Map<string, IdeaStatusEntry>): IdeaStatsResponse {
  const stats = {
    total: statusMap.size,
    new: 0,
    approved: 0,
    parked: 0,
    rejected: 0,
    specced: 0,
    building: 0,
    shipped: 0,
    review: 0,
    approvalRate: 0,
    avgTimeToShip: "0h",
    successRate: 0,
    completionRate: 0,
  };

  const shippedTimes: number[] = [];
  let successCount = 0;
  let totalReviewed = 0;

  for (const entry of statusMap.values()) {
    const status = entry.status as IdeaStatus;
    switch (status) {
      case "new":
        stats.new++;
        break;
      case "approved":
        stats.approved++;
        break;
      case "parked":
        stats.parked++;
        break;
      case "rejected":
        stats.rejected++;
        break;
      case "specced":
        stats.specced++;
        break;
      case "building":
        stats.building++;
        break;
      case "shipped":
        stats.shipped++;
        break;
      case "review":
        stats.review++;
        break;
    }

    // Calculate time to ship
    if (entry.approvedAt && entry.shippedAt) {
      const approvedTime = new Date(entry.approvedAt).getTime();
      const shippedTime = new Date(entry.shippedAt).getTime();
      const hours = (shippedTime - approvedTime) / (1000 * 60 * 60);
      shippedTimes.push(hours);
    }

    // Track review outcomes
    if (entry.reviewOutcome) {
      totalReviewed++;
      if (entry.reviewOutcome === "success") {
        successCount++;
      }
    }
  }

  // Calculate approval rate
  const totalConsidered = stats.new + stats.approved + stats.rejected + stats.parked;
  if (totalConsidered > 0) {
    stats.approvalRate = stats.approved / totalConsidered;
  }

  // Calculate average time to ship
  if (shippedTimes.length > 0) {
    const avgHours = shippedTimes.reduce((a, b) => a + b, 0) / shippedTimes.length;
    stats.avgTimeToShip = `${Math.round(avgHours)}h`;
  }

  // Calculate success rate (successes / total reviewed)
  if (totalReviewed > 0) {
    stats.successRate = successCount / totalReviewed;
  }

  // Calculate completion rate (shipped + reviewed / total approved)
  const totalApproved = stats.approved + stats.specced + stats.building + stats.shipped + stats.review;
  if (totalApproved > 0) {
    stats.completionRate = (stats.shipped + stats.review) / totalApproved;
  }

  return stats;
}
