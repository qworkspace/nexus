"use client";

import { useState, useEffect } from "react";

export interface CostBreakdown {
  byModel: {
    opus: number;
    sonnet: number;
    glm: number;
  };
  byAgent: {
    Q: number;
    Dev: number;
    others: number;
  };
}

interface CostData {
  today: number;
  budget: number;
  budgetPercent: number;
  projection: number;
  withinBudget: boolean;
  breakdown: CostBreakdown;
}

const MOCK_COSTS: CostData = {
  today: 12.47,
  budget: 24.00,
  budgetPercent: 52,
  projection: 18.70,
  withinBudget: true,
  breakdown: {
    byModel: {
      opus: 11.20,
      sonnet: 1.27,
      glm: 0.00,
    },
    byAgent: {
      Q: 10.50,
      Dev: 0.00,
      others: 1.97,
    },
  },
};

export function useCosts() {
  const [costs, setCosts] = useState<CostData>(MOCK_COSTS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time cost updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCosts((prev) => {
        // Simulate small cost increments
        const increment = Math.random() * 0.05;
        const newToday = prev.today + increment;
        const newBudgetPercent = Math.round((newToday / prev.budget) * 100);
        
        // Recalculate projection based on time of day
        const now = new Date();
        const hoursPassed = now.getHours() + now.getMinutes() / 60;
        const hoursRemaining = 24 - hoursPassed;
        const ratePerHour = newToday / hoursPassed;
        const newProjection = newToday + (ratePerHour * hoursRemaining);
        
        return {
          ...prev,
          today: newToday,
          budgetPercent: newBudgetPercent,
          projection: newProjection,
          withinBudget: newProjection <= prev.budget,
        };
      });
      setLastUpdated(new Date());
    }, 10000); // 10-second refresh

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getProgressColor = (percent: number): string => {
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return {
    costs,
    lastUpdated,
    formatCurrency,
    getProgressColor,
  };
}
