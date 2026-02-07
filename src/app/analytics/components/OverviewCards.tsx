"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewData {
  messages: number;
  messagesChange: number;
  cost: number;
  costChange: number;
  sessions: number;
  sessionsChange: number;
  successRate: number;
}

interface OverviewCardsProps {
  data: OverviewData;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const cards = [
    {
      title: "Messages",
      value: data.messages.toLocaleString(),
      change: data.messagesChange,
      icon: "💬",
    },
    {
      title: "Cost",
      value: `$${data.cost.toFixed(2)}`,
      change: data.costChange,
      icon: "💰",
    },
    {
      title: "Sessions",
      value: data.sessions.toLocaleString(),
      change: data.sessionsChange,
      icon: "📊",
    },
    {
      title: "Success Rate",
      value: `${data.successRate}%`,
      change: null,
      icon: "✅",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
              <span className="text-lg">{card.icon}</span>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 mb-2">
              {card.value}
            </div>
            {card.change !== null && (
              <div
                className={`text-sm font-medium ${
                  card.change >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {card.change >= 0 ? "▲" : "▼"} {Math.abs(card.change)}%
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
