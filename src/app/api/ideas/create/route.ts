import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/spec-briefs";
const STATUS_FILE = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/idea-status.json";

type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

type SourceTag = "research" | "pj-request" | "q-identified";

interface CreateIdeaRequest {
  title: string;
  description: string;
  benefits: string[];
  successMetrics: string[];
  source: SourceTag;
  priority: "HIGH" | "MED" | "LOW";
}

interface CreateIdeaResponse {
  id: string;
  filename: string;
  title: string;
  status: IdeaStatus;
  createdAt: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateIdeaRequest;
    const { title, description, benefits, successMetrics, source, priority } = body;

    // Validate required fields
    if (!title || !description || !source || !priority) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, source, priority" },
        { status: 400 }
      );
    }

    // Validate source tag
    if (!["research", "pj-request", "q-identified"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source tag. Must be: research, pj-request, or q-identified" },
        { status: 400 }
      );
    }

    // Validate priority
    if (!["HIGH", "MED", "LOW"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be: HIGH, MED, or LOW" },
        { status: 400 }
      );
    }

    // Generate ID and filename
    const id = randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${timestamp}-${id}.md`;

    // Create spec brief content
    const content = generateSpecBriefContent(title, description, benefits, successMetrics, source, priority);

    // Ensure directories exist
    const fs = await import("fs/promises");
    await fs.mkdir(SPEC_BRIEFS_DIR, { recursive: true });

    // Write spec brief file
    const filepath = join(SPEC_BRIEFS_DIR, filename);
    writeFileSync(filepath, content, "utf-8");

    // Update status file
    const statusMap = loadStatusMap();
    statusMap.set(filename, {
      status: "new",
      createdAt: new Date().toISOString(),
    });
    saveStatusMap(statusMap);

    return NextResponse.json({
      id,
      filename,
      title,
      status: "new",
      createdAt: new Date().toISOString(),
    } as CreateIdeaResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}

function generateSpecBriefContent(
  title: string,
  description: string,
  benefits: string[],
  successMetrics: string[],
  source: SourceTag,
  priority: "HIGH" | "MED" | "LOW"
): string {
  const benefitsList = benefits.length > 0
    ? benefits.map(b => `  - ${b}`).join("\n")
    : "  - (No benefits defined)";

  const metricsList = successMetrics.length > 0
    ? successMetrics.map(m => `  - ${m}`).join("\n")
    : "  - (No success metrics defined)";

  return `# Spec Brief: ${title}

**Source:** ${source}
**Priority:** ${priority}
**Created:** ${new Date().toISOString()}

## Problem Statement

${description}

## Why This Matters (Benefits)

${benefitsList}

## Success Metrics

${metricsList}

## Proposed Solution

(To be defined during spec creation)

## Notes

Created manually via Research Hub.
`;
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
  createdAt?: string;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
}

function saveStatusMap(map: Map<string, IdeaStatusEntry>) {
  const data: Record<string, IdeaStatusEntry> = {};

  for (const [filename, entry] of map.entries()) {
    data[filename] = entry;
  }

  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}
