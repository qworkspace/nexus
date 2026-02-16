import { NextResponse } from 'next/server';
import { fetchCostData } from '@/lib/cost-data-service';
import { transformCostData, TransformedCostData } from '@/lib/cost-transformer';

function toAESTDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  // Returns YYYY-MM-DD format in AEST
}

export async function GET() {
  try {
    const cliData = await fetchCostData();
    const transformed = transformCostData(cliData);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Cost API error:', error);
    return NextResponse.json(
      {
        source: 'mock' as const,
        today: {
          date: toAESTDateStr(new Date()),
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
        },
        thisWeek: {
          date: toAESTDateStr(new Date()),
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
        },
        thisMonth: {
          date: toAESTDateStr(new Date()),
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
        },
        byModel: [],
        byDay: [],
        byType: {
          input: { tokens: 0, cost: 0 },
          output: { tokens: 0, cost: 0 },
          cacheRead: { tokens: 0, cost: 0 },
          cacheWrite: { tokens: 0, cost: 0 },
        },
        topExpensive: [],
      } as TransformedCostData,
      { status: 500 }
    );
  }
}
