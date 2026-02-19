'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface MemoryChunkCardProps {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    type: string;
    chunk_index: number;
    total_chunks: number;
  };
  created_at: string;
}

function formatSourcePath(path: string): string {
  // Extract just the filename and parent directory
  const parts = path.split('/');
  if (parts.length >= 2) {
    return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return path;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSimilarityColor(score: number): string {
  if (score >= 0.8) return 'bg-zinc-100 text-zinc-700';
  if (score >= 0.6) return 'bg-yellow-100 text-yellow-700';
  if (score >= 0.4) return 'bg-zinc-100 text-zinc-700';
  return 'bg-gray-100 text-gray-700';
}

export function MemoryChunkCard({
  id,
  content,
  similarity,
  metadata,
  created_at,
}: MemoryChunkCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Preview first ~200 chars
  const preview = content.length > 200 ? content.slice(0, 200) + '...' : content;
  const displayContent = expanded ? content : preview;

  return (
    <div className="border border-zinc-200 rounded-lg bg-white hover:border-zinc-400 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Source */}
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground truncate">
                {formatSourcePath(metadata.source)}
              </span>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Chunk {metadata.chunk_index + 1} of {metadata.total_chunks}</span>
              <span>•</span>
              <span>{formatDate(created_at)}</span>
              <span>•</span>
              <span className="font-mono">{id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Similarity Score */}
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getSimilarityColor(
              similarity
            )}`}
          >
            {(similarity * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="prose prose-sm max-w-none text-zinc-700">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {displayContent}
          </pre>
        </div>

        {/* Expand/Collapse Button */}
        {content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-zinc-900 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
