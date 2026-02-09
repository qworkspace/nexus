'use client';

import { useParams } from 'next/navigation';
import { TranscriptViewer } from '@/components/transcripts/TranscriptViewer';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { Transcript } from '@/types/transcripts';

interface TranscriptResponse {
  source: 'live' | 'mock' | 'error';
  data: Transcript;
  error?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const { data, error, isLoading } = useSWR<TranscriptResponse>(
    `/api/transcripts/${sessionId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-500">Loading session transcript...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load session transcript</p>
          <p className="text-sm text-zinc-500">Session ID: {sessionId}</p>
          {data?.error && <p className="text-xs text-zinc-400 mt-2">{data.error}</p>}
        </div>
      </div>
    );
  }

  return <TranscriptViewer transcript={data.data} />;
}
