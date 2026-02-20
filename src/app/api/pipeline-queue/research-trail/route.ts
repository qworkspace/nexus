import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const briefId = searchParams.get('briefId');

  if (!briefId) {
    return NextResponse.json({ content: null, exists: false }, { status: 200 });
  }

  const filePath = `/Users/paulvillanueva/.openclaw/shared/research/ai-intel/research-trails/${briefId}.md`;

  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json({ content, exists: true }, { status: 200 });
  } catch (error) {
    // File doesn't exist or can't be read
    return NextResponse.json({ content: null, exists: false }, { status: 200 });
  }
}
