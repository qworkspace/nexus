import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const FIXES_FILE = "/Users/paulvillanueva/shared/pipeline/fixes.json";

interface FixEntry {
  whatBroke: string;
  whatFixed: string;
  when: string;
  agent: string;
}

interface FixesResponse {
  fixes: FixEntry[];
  total: number;
}

export async function GET() {
  try {
    const fixes = await loadFixes();

    return NextResponse.json({
      fixes,
      total: fixes.length,
    } as FixesResponse);
  } catch (error) {
    console.error("Error fetching fixes:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixes" },
      { status: 500 }
    );
  }
}

async function loadFixes(): Promise<FixEntry[]> {
  if (!existsSync(FIXES_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(FIXES_FILE, "utf-8");
    const data = JSON.parse(content) as FixEntry[];

    // Sort by date descending
    return data.sort((a, b) => {
      const dateA = new Date(a.when).getTime();
      const dateB = new Date(b.when).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error loading fixes:", error);
    return [];
  }
}
