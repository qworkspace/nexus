import { NextRequest, NextResponse } from 'next/server';
import { bugService } from '@/lib/bugs';
import type { UpdateBugInput } from '@/lib/bugs/types';

// GET /api/bugs/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bug = await bugService.get(params.id);
    
    if (!bug) {
      return NextResponse.json(
        { error: 'Bug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error('Error fetching bug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bug' },
      { status: 500 }
    );
  }
}

// PATCH /api/bugs/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateBugInput = await request.json();
    const bug = await bugService.update(params.id, body);
    
    if (!bug) {
      return NextResponse.json(
        { error: 'Bug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error('Error updating bug:', error);
    return NextResponse.json(
      { error: 'Failed to update bug' },
      { status: 500 }
    );
  }
}

// DELETE /api/bugs/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await bugService.delete(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Bug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bug:', error);
    return NextResponse.json(
      { error: 'Failed to delete bug' },
      { status: 500 }
    );
  }
}
