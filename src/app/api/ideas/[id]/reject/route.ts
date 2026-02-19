import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped";

interface IdeaStatusEntry {
  status: IdeaStatus;
  approvedAt?: string;
  specPath?: string;
  buildStatus?: IdeaStatus;
  buildId?: string;
  shippedAt?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filename = `${id}.md`;

    const statusMap = loadStatusMap();

    if (!statusMap.has(filename)) {
      statusMap.set(filename, { status: "new" });
    }

    const entry = statusMap.get(filename)!;
    entry.status = "rejected";

    saveStatusMap(statusMap);

    return NextResponse.json({
      id,
      filename,
      status: entry.status,
    });
  } catch (error) {
    console.error("Error rejecting idea:", error);
    return NextResponse.json(
      { error: "Failed to reject idea" },
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
