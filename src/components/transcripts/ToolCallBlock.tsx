'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle, XCircle } from 'lucide-react';

interface ToolCallBlockProps {
  name: string;
  input: Record<string, unknown>;
  isResult?: boolean;
  isError?: boolean;
}

export function ToolCallBlock({ name, input, isResult, isError }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const jsonContent = JSON.stringify(input, null, 2);

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 text-xs font-mono transition-colors ${
          isError
            ? 'text-red-600 hover:text-red-700'
            : isResult
            ? 'text-emerald-600 hover:text-emerald-700'
            : 'text-violet-600 hover:text-violet-700'
        }`}
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {isResult ? (
          isError ? (
            <XCircle className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )
        ) : (
          <Terminal className="w-3 h-3" />
        )}
        <span>{isResult ? (isError ? 'Error' : 'Result') : 'Tool Call'}: {name}</span>
      </button>
      {expanded && (
        <div
          className={`mt-2 rounded-lg border font-mono text-xs overflow-x-auto ${
            isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : isResult
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-card border-border text-foreground'
          }`}
        >
          <pre className="p-3 whitespace-pre-wrap">{jsonContent}</pre>
        </div>
      )}
    </div>
  );
}
