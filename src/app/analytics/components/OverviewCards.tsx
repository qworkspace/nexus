"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, DollarSign, BarChart3, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";


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
      icon: MessageSquare,
    },
    {
      title: "Cost",
      value: `$${data.cost.toFixed(2)}`,
      change: data.costChange,
      icon: DollarSign,
    },
    {
      title: "Sessions",
      value: data.sessions.toLocaleString(),
      change: data.sessionsChange,
      icon: BarChart3,
    },
    {
      title: "Success Rate",
      value: `${data.successRate}%`,
      change: null,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <Icon size={18} className="text-zinc-600" />
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
                  {card.change >= 0 ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />} {Math.abs(card.change)}%
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
