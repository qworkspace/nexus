"use client";

type TimePeriod = "today" | "week" | "month";

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <div className="inline-flex bg-zinc-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === period.value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
