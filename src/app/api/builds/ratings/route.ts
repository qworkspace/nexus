import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

const FEEDBACK_FILE = '/Users/paulvillanueva/shared/pipeline/build-feedback.json';

export async function GET() {
  try {
    const data = await readFile(FEEDBACK_FILE, 'utf-8');
    const feedback = JSON.parse(data);
    return NextResponse.json(feedback);
  } catch {
    // If file doesn't exist, return empty ratings
    return NextResponse.json({ ratings: [] });
  }
}
