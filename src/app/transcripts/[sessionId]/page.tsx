import { notFound } from 'next/navigation';
import { TranscriptViewer } from '@/components/transcripts/TranscriptViewer';
import { getMockTranscript } from '@/data/mock-transcripts';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function TranscriptDetailPage({ params }: PageProps) {
  const { sessionId } = await params;
  const transcript = getMockTranscript(sessionId);

  if (!transcript) {
    notFound();
  }

  return <TranscriptViewer transcript={transcript} />;
}
