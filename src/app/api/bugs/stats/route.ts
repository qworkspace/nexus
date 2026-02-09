import { NextResponse } from 'next/server';
import { bugService } from '@/lib/bugs';

// GET /api/bugs/stats
export async function GET() {
  try {
    const stats = await bugService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching bug stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bug stats' },
      { status: 500 }
    );
  }
}
