"use client";

// No lucide-react imports needed - using pure CSS

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
    <div className={`group relative ${className}`}>
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

// MetricTooltipWithIcon removed - no longer needed
// Use MetricTooltip directly for pure CSS hover tooltips