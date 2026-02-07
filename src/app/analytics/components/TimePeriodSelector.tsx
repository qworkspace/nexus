"use client";

import { useState } from "react";

type TimePeriod = "today" | "week" | "month";

interface TimePeriodSelectorProps {
  onChange?: (period: TimePeriod) => void;
}

export function TimePeriodSelector({ onChange }: TimePeriodSelectorProps) {
  const [selected, setSelected] = useState<TimePeriod>("week");

  const periods: { value: TimePeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const handleSelect = (period: TimePeriod) => {
    setSelected(period);
    onChange?.(period);
  };

  return (
    <div className="inline-flex bg-zinc-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handleSelect(period.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selected === period.value
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
