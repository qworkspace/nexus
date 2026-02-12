import { NextResponse } from 'next/server';
import { fetchCostData, invalidateCostCache, getCacheStatus } from '@/lib/cost-data-service';
import { transformCostData } from '@/lib/cost-transformer';

export async function POST() {
  try {
    const beforeStatus = getCacheStatus();

    invalidateCostCache();
    const freshData = await fetchCostData();
    const transformed = transformCostData(freshData);
    const afterStatus = getCacheStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: transformed,
      cache: {
        wasCached: beforeStatus.cached,
        cacheAgeMs: beforeStatus.age,
        nowCached: afterStatus.cached,
      }
    });
  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cost cache' },
      { status: 500 }
    );
  }
}
