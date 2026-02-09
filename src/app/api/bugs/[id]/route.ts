import { NextResponse } from 'next/server';
import {
  getBugById,
  updateBug,
  deleteBug,
} from '@/lib/bugs/BugService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bug = await getBugById(params.id);

    if (!bug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bug not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bug,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch bug:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bug',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { changedBy, ...updates } = body;

    if (!changedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: changedBy',
        },
        { status: 400 }
      );
    }

    const bug = await updateBug(params.id, updates, changedBy);

    if (!bug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bug not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bug,
    });
  } catch (error: unknown) {
    console.error('Failed to update bug:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bug',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteBug(params.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bug not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bug deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Failed to delete bug:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bug',
      },
      { status: 500 }
    );
  }
}
