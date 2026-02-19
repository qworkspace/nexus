"use client";

type CacheEfficiencyCardProps = {
  hitRate: number;
  cacheReadCost: number;
  cacheReadTokens: number;
  totalTokens: number;
  period: "7d" | "30d";
};

export function CacheEfficiencyCard({
  hitRate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cacheReadCost: _cacheReadCost,
  cacheReadTokens,
  totalTokens,
  period,
}: CacheEfficiencyCardProps) {
  const getColor = () => {
    if (hitRate >= 85) return "text-zinc-900";
    if (hitRate >= 70) return "text-zinc-900";
    if (hitRate >= 50) return "text-zinc-500";
    return "text-zinc-500";
  };

  const getGaugeColor = () => {
    if (hitRate >= 85) return "#A8B5A0";
    if (hitRate >= 70) return "#F5D547";
    if (hitRate >= 50) return "#D4C5A9";
    return "#8E99A4";
  };

  const strokeWidth = 8;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (hitRate / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate ({period})</p>
      <div className="flex items-center justify-center mt-4">
        <svg width={100} height={100} className="transform -rotate-90">
          <circle
            cx={50}
            cy={50}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-zinc-200"
          />
          <circle
            cx={50}
            cy={50}
            r={radius}
            stroke={getGaugeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className={`text-3xl font-bold absolute ${getColor()}`}>
          {hitRate.toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {totalTokens > 0 ? `${(cacheReadTokens / totalTokens * 100).toFixed(1)}% cached` : "No data"}
      </p>
    </div>
  );
}
