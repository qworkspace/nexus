'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <BrainCircuit className="w-3 h-3" />
        <span>Thinking</span>
      </button>
      {expanded && (
        <div className="mt-2 ml-1 p-3 bg-zinc-100 rounded-lg text-sm text-zinc-600 italic border-l-2 border-zinc-300">
          <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      )}
    </div>
  );
}
