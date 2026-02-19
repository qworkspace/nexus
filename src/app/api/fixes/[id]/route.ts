import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const FIXES_FILE = "/Users/paulvillanueva/shared/pipeline/fixes.json";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, fixCommit, whatFixed, fixBriefPath } = body;

    // Read existing fixes
    let fixes: FixEntry[] = [];
    if (existsSync(FIXES_FILE)) {
      const content = readFileSync(FIXES_FILE, 'utf-8');
      fixes = JSON.parse(content);
    }

    // Find the entry
    const index = fixes.findIndex(f => f.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Fix Log entry not found' },
        { status: 404 }
      );
    }

    // Update the entry
    if (status) fixes[index].status = status;
    if (fixCommit) fixes[index].fixCommit = fixCommit;
    if (whatFixed) fixes[index].whatFixed = whatFixed;
    if (fixBriefPath) fixes[index].fixBriefPath = fixBriefPath;

    // Write back
    writeFileSync(FIXES_FILE, JSON.stringify(fixes, null, 2));

    return NextResponse.json({
      message: 'Fix Log entry updated',
      entry: fixes[index]
    });
  } catch (error) {
    console.error('Error updating Fix Log entry:', error);
    return NextResponse.json(
      { error: 'Failed to update Fix Log entry' },
      { status: 500 }
    );
  }
}
