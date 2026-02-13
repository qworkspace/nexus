"use client";

import { Info } from "lucide-react";

interface MetricTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple CSS-based tooltip for metric explanations.
 * Uses group-hover pattern for lightweight implementation without Radix dependency.
 */
export function MetricTooltip({ content, children, className = "" }: MetricTooltipProps) {
  return (
    <div className={`group relative inline-block ${className}`}>
      {children}
      <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="relative">
          {/* Arrow */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45" />
          {content}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper that adds an Info icon to the wrapped content.
 */
export function MetricTooltipWithIcon({ content, children, className = "" }: MetricTooltipProps) {
  return (
    <MetricTooltip content={content} className={className}>
      <span className="inline-flex items-center gap-1 cursor-help">
        {children}
        <Info className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-500 transition-colors shrink-0" />
      </span>
    </MetricTooltip>
  );
}