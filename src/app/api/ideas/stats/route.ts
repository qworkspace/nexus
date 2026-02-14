import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/spec-briefs";
const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type BriefStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

interface BriefStatusEntry {
  status: BriefStatus;
  title?: string;
  bullets?: string[];
  priority?: "HIGH" | "MED" | "LOW";
  complexity?: "LOW" | "MED" | "HIGH";
  notes?: string;
  approvedAt?: string;
  createdAt?: string;
  specPath?: string;
  buildStatus?: BriefStatus;
  buildId?: string;
  shippedAt?: string;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
  sourceUrl?: string;
}

interface BriefStats {
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
  complexityBreakdown: { LOW: number; MED: number; HIGH: number };
  priorityBreakdown: { LOW: number; MED: number; HIGH: number };
  successRate: number;
  completionRate: number;
}

interface BriefWithPriority {
  status: BriefStatus;
  priority?: "HIGH" | "MED" | "LOW";
  complexity?: "LOW" | "MED" | "HIGH";
  approvedAt?: string;
  shippedAt?: string;
  createdAt?: string;
}

export async function GET() {
  try {
    const briefsWithDetails = await getBriefsWithDetails();
    const stats = calculateStats(briefsWithDetails);

    return NextResponse.json(stats as BriefStats);
  } catch (error) {
    console.error("Error fetching brief stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch brief stats" },
      { status: 500 }
    );
  }
}

async function getBriefsWithDetails(): Promise<BriefWithPriority[]> {
  const briefs: BriefWithPriority[] = [];
  const statusMap = loadStatusMap();

  if (!existsSync(SPEC_BRIEFS_DIR)) {
    return briefs;
  }

  const files = readdirSync(SPEC_BRIEFS_DIR)
    .filter((f) => f.endsWith(".md") && !f.endsWith(".processed"));

  for (const filename of files) {
    const filepath = join(SPEC_BRIEFS_DIR, filename);
    const content = readFileSync(filepath, "utf-8");
    const statusEntry = statusMap.get(filename);

    // Extract priority from content
    const priorityMatch = content.match(/\*\*Priority:\*\*\s*(HIGH|MED|LOW)/i) ||
                           content.match(/priority:\s*(HIGH|MED|LOW)/i);
    const priority = (statusEntry?.priority || priorityMatch?.[1]?.toUpperCase()) as "HIGH" | "MED" | "LOW" | undefined;

    // Extract complexity from content
    const complexityMatch = content.match(/complexity:\s*(LOW|MED|HIGH)/i);
    const complexity = (statusEntry?.complexity || complexityMatch?.[1]?.toUpperCase()) as "LOW" | "MED" | "HIGH" | undefined;

    briefs.push({
      status: statusEntry?.status || "new",
      priority,
      complexity,
      approvedAt: statusEntry?.approvedAt,
      shippedAt: statusEntry?.shippedAt,
      createdAt: statusEntry?.createdAt,
    });
  }

  return briefs;
}

function loadStatusMap(): Map<string, BriefStatusEntry> {
  const map = new Map<string, BriefStatusEntry>();

  if (!existsSync(STATUS_FILE)) {
    return map;
  }

  try {
    const content = readFileSync(STATUS_FILE, "utf-8");
    const data = JSON.parse(content);

    for (const [filename, entry] of Object.entries(data)) {
      map.set(filename, entry as BriefStatusEntry);
    }
  } catch (error) {
    console.error("Error loading status map:", error);
  }

  return map;
}

function calculateStats(briefs: BriefWithPriority[]): BriefStats {
  const stats = {
    total: briefs.length,
    new: 0,
    approved: 0,
    parked: 0,
    rejected: 0,
    specced: 0,
    building: 0,
    shipped: 0,
    review: 0,
    approvalRate: 0,
    avgTimeToShip: "N/A",
    complexityBreakdown: { LOW: 0, MED: 0, HIGH: 0 },
    priorityBreakdown: { LOW: 0, MED: 0, HIGH: 0 },
    successRate: 0,
    completionRate: 0,
  };

  const shippedTimes: number[] = [];
  let successCount = 0;
  let totalReviewed = 0;

  for (const brief of briefs) {
    const status = brief.status as BriefStatus;
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

    // Track complexity breakdown
    if (brief.complexity) {
      stats.complexityBreakdown[brief.complexity]++;
    }

    // Track priority breakdown
    if (brief.priority) {
      stats.priorityBreakdown[brief.priority]++;
    }

    // Calculate time to ship
    if (brief.approvedAt && brief.shippedAt) {
      const approvedTime = new Date(brief.approvedAt).getTime();
      const shippedTime = new Date(brief.shippedAt).getTime();
      const diff = shippedTime - approvedTime;
      shippedTimes.push(diff);
    }
  }

  // Calculate approval rate
  const totalConsidered = stats.new + stats.approved + stats.rejected + stats.parked;
  if (totalConsidered > 0) {
    stats.approvalRate = stats.approved / totalConsidered;
  }

  // Calculate average time to ship
  if (shippedTimes.length > 0) {
    const avgMs = shippedTimes.reduce((a, b) => a + b, 0) / shippedTimes.length;
    stats.avgTimeToShip = formatTime(avgMs);
  }

  // Load status map for review outcomes
  const statusMap = loadStatusMap();
  for (const entry of statusMap.values()) {
    if (entry.reviewOutcome) {
      totalReviewed++;
      if (entry.reviewOutcome === "success") {
        successCount++;
      }
    }
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

function formatTime(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
