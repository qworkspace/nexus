import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { outcome, note } = body;

    // Validate outcome
    if (!outcome || !["success", "partial", "failed"].includes(outcome)) {
      return NextResponse.json(
        { error: "Invalid outcome. Must be 'success', 'partial', or 'failed'" },
        { status: 400 }
      );
    }

    const filename = `${id}.md`;
    const statusMap = loadStatusMap();

    // Check idea exists
    if (!statusMap.has(filename)) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    const entry = statusMap.get(filename)!;

    // Only allow review for shipped ideas
    if (entry.status !== "shipped") {
      return NextResponse.json(
        { error: "Can only review shipped ideas" },
        { status: 400 }
      );
    }

    // Update status and review fields
    entry.status = "review";
    entry.reviewOutcome = outcome;
    entry.reviewNote = note || "";
    entry.reviewedAt = new Date().toISOString();

    saveStatusMap(statusMap);

    return NextResponse.json({
      id,
      filename,
      status: entry.status,
      reviewOutcome: entry.reviewOutcome,
      reviewNote: entry.reviewNote,
      reviewedAt: entry.reviewedAt,
    });
  } catch (error) {
    console.error("Error reviewing idea:", error);
    return NextResponse.json(
      { error: "Failed to review idea" },
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

function saveStatusMap(map: Map<string, IdeaStatusEntry>) {
  const data: Record<string, IdeaStatusEntry> = {};

  for (const [filename, entry] of map.entries()) {
    data[filename] = entry;
  }

  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}
