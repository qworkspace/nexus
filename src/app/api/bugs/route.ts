import { NextResponse } from 'next/server';
import {
  getBugs,
  createBug,
  seedSampleBugs,
  type BugStatus,
  type BugPriority,
  type BugCategory,
} from '@/lib/bugs/BugService';

export async function GET(request: Request) {
  try {
    // Ensure we have some bugs to show
    await seedSampleBugs();

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as BugStatus) || undefined;
    const priority = (searchParams.get('priority') as BugPriority) || undefined;
    const category = (searchParams.get('category') as BugCategory) || undefined;
    const assignee = searchParams.get('assignee') || undefined;
    const label = searchParams.get('label') || undefined;
    const search = searchParams.get('search') || undefined;

    const bugs = await getBugs({
      status,
      priority,
      category,
      assignee,
      label,
      search,
    });

    return NextResponse.json({
      success: true,
      data: bugs,
      count: bugs.length,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch bugs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bugs',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, category, author, assignee } = body;

    if (!title || !description || !priority || !category || !author) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, description, priority, category, author',
        },
        { status: 400 }
      );
    }

    const bug = await createBug(
      title,
      description,
      priority,
      category,
      author,
      assignee
    );

    return NextResponse.json({
      success: true,
      data: bug,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create bug:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bug',
      },
      { status: 500 }
    );
  }
}
