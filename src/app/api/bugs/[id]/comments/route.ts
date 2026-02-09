import { NextResponse } from 'next/server';
import { addComment } from '@/lib/bugs/BugService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { author, content } = body;

    if (!author || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: author, content',
        },
        { status: 400 }
      );
    }

    const bug = await addComment(params.id, author, content);

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
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}
