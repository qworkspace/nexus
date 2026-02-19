import { NextResponse } from "next/server";
import { readFileSync, existsSync, writeFileSync } from "fs";

export const dynamic = "force-dynamic";

const FIXES_FILE = "/Users/paulvillanueva/.openclaw/shared/pipeline/fixes.json";

interface FixEntry {
  id: string;
  spec: string;
  commit: string;
  whatBroke: string;
  whatFixed: string;
  when: string;
  status: 'open' | 'fix_briefed' | 'fix_building' | 'fix_shipped' | 'verified';
  sourceRating: 'bad' | 'useless';
  issues: string[];
  pjComment?: string;
  fixBriefPath?: string;
  fixCommit?: string;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { spec, commit, rating, issues, context, agent } = body;

    if (rating !== 'bad' && rating !== 'useless') {
      return NextResponse.json({
        message: 'Only bad/useless ratings create Fix Log entries'
      });
    }

    let fixes: FixEntry[] = [];
    try {
      if (existsSync(FIXES_FILE)) {
        const content = readFileSync(FIXES_FILE, 'utf-8');
        fixes = JSON.parse(content);
      }
    } catch {
      fixes = [];
    }

    // Check if entry already exists for this spec/commit
    const existing = fixes.find(f => f.spec === spec && f.commit === commit);
    if (existing) {
      return NextResponse.json({
        message: 'Fix Log entry already exists',
        entry: existing
      });
    }

    // Create new Fix Log entry
    const newEntry: FixEntry = {
      id: `fix-${spec}-${new Date().toISOString().split('T')[0]}`,
      spec,
      commit,
      whatBroke: (issues || []).join('; '),
      whatFixed: '', // To be filled when fix ships
      when: new Date().toISOString(),
      status: 'open',
      sourceRating: rating,
      issues: issues || [],
      pjComment: context,
      agent: agent || 'unknown',
    };

    fixes.unshift(newEntry); // Add to beginning

    writeFileSync(FIXES_FILE, JSON.stringify(fixes, null, 2));

    return NextResponse.json({
      message: 'Fix Log entry created',
      entry: newEntry
    });
  } catch (error) {
    console.error('Error creating Fix Log entry:', error);
    return NextResponse.json(
      { error: 'Failed to create Fix Log entry' },
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
