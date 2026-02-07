"use client";

import useSWR from 'swr';
import { fetcher, OpenClawStatusResponse } from '@/lib/openclaw-client';

export function useOpenClawStatus() {
  const { data, error, isLoading, mutate } = useSWR<OpenClawStatusResponse>(
    '/api/openclaw/status',
    fetcher,
    {
      refreshInterval: 30000, // 30-second check
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );

  return {
    online: data?.online || false,
    isLoading,
    error: error || data?.error,
    suggestion: data?.suggestion,
    gatewayData: data?.data,
    mutate,
  };
}
