import { NextRequest, NextResponse } from 'next/server';
import { bugService } from '@/lib/bugs';
import type { BugFilters, CreateBugInput, Project, Severity, BugStatus } from '@/lib/bugs/types';

// GET /api/bugs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: BugFilters = {
      project: searchParams.get('project') as Project | undefined,
      severity: searchParams.get('severity') as Severity | undefined,
      status: searchParams.get('status') as BugStatus | undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await bugService.list(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bugs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bugs' },
      { status: 500 }
    );
  }
}

// POST /api/bugs
export async function POST(request: NextRequest) {
  try {
    const body: CreateBugInput = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.project || !body.severity || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bug = await bugService.create(body);
    return NextResponse.json(bug, { status: 201 });
  } catch (error) {
    console.error('Error creating bug:', error);
    return NextResponse.json(
      { error: 'Failed to create bug' },
      { status: 500 }
    );
  }
}
