import { NextResponse } from 'next/server';
import { getBugStats, seedSampleBugs } from '@/lib/bugs/BugService';

export async function GET() {
  try {
    // Ensure we have some bugs to show
    await seedSampleBugs();

    const stats = await getBugStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch bug stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bug stats',
      },
      { status: 500 }
    );
  }
}
