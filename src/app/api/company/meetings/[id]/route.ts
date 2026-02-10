import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const MEETINGS_DIR = join(process.env.HOME || '', 'shared/meetings');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = join(MEETINGS_DIR, `${id}.md`);
    const content = readFileSync(filePath, 'utf-8');
    return NextResponse.json({ id, content });
  } catch (error) {
    return NextResponse.json(
      { error: 'Meeting not found', detail: String(error) },
      { status: 404 }
    );
  }
}
