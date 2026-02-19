"use client";

type CacheBreakdownProps = {
  tokens: {
    cacheRead: number;
    cacheWrite: number;
    input: number;
    output: number;
    total: number;
  };
  costs: {
    cacheRead: number;
    cacheWrite: number;
    input: number;
    output: number;
    total: number;
  };
};

// type BreakdownItem = {
//   label: string;
//   value: number;
//   color: string;
// };

export function CacheBreakdown({ tokens, costs }: CacheBreakdownProps) {
  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const tokenItems = [
    { label: "Cache Read", value: tokens.cacheRead, color: "bg-[#FFE135]" },
    { label: "Cache Write", value: tokens.cacheWrite, color: "bg-foreground" },
    { label: "Fresh Input", value: tokens.input, color: "bg-purple-500" },
    { label: "Fresh Output", value: tokens.output, color: "bg-zinc-500" },
  ];

  const costItems = [
    { label: "Cache Read", value: costs.cacheRead, color: "bg-[#FFE135]" },
    { label: "Cache Write", value: costs.cacheWrite, color: "bg-foreground" },
    { label: "Fresh Input", value: costs.input, color: "bg-purple-500" },
    { label: "Fresh Output", value: costs.output, color: "bg-zinc-500" },
  ];

  const BreakdownSection = ({ title, items, total, isCost }: { title: string; items: { label: string; value: number; color: string }[]; total: number; isCost: boolean }) => {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground mb-4">{title}</h3>
        <div className="space-y-3">
          {items.map((item, i) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground dark:text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-zinc-900 dark:text-foreground">
                    {isCost ? `$${item.value.toFixed(2)}` : formatTokens(item.value)}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-zinc-100 dark:border-border mt-4 pt-3">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-900 dark:text-foreground">Total</span>
            <span className="text-zinc-900 dark:text-foreground">
              {isCost ? `$${total.toFixed(2)}` : formatTokens(total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <BreakdownSection title="Tokens Breakdown" items={tokenItems} total={tokens.total} isCost={false} />
      <BreakdownSection title="Cost Breakdown" items={costItems} total={costs.total} isCost={true} />
    </div>
  );
}
