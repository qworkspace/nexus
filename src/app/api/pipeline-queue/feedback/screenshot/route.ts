import { NextResponse } from 'next/server';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { homedir } from 'os';

const SCREENSHOTS_DIR = join(homedir(), '.openclaw', 'shared', 'pipeline', 'build-screenshots');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const briefId = formData.get('briefId') as string | null;

    if (!file || !briefId) {
      return NextResponse.json({ error: 'file and briefId are required' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only jpg, png, webp allowed' }, { status: 400 });
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = extname(file.name) || (file.type === 'image/webp' ? '.webp' : file.type === 'image/png' ? '.png' : '.jpg');
    const timestamp = Date.now();
    const filename = `${briefId}-${timestamp}${ext}`;
    const filePath = join(SCREENSHOTS_DIR, filename);

    if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    return NextResponse.json({ ok: true, path: filePath, filename });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 });

    // Security: must be within screenshots dir
    if (!filePath.startsWith(SCREENSHOTS_DIR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const buffer = readFileSync(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    return new Response(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
  }
}
