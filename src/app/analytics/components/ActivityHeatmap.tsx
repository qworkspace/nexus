"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from 'lucide-react';


interface HeatmapData {
  day: string;
  hours: number[];
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Find max value for normalization
  const maxValue = Math.max(...data.flatMap((d) => d.hours));

  // Calculate activity level
  const getActivityLevel = (value: number) => {
    if (value === 0) return "bg-zinc-100";
    const ratio = value / maxValue;
    if (ratio >= 0.7) return "bg-zinc-900";
    if (ratio >= 0.4) return "bg-zinc-600";
    return "bg-zinc-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Flame size={16} />
          Activity Heatmap (Messages)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  {HOURS.map((hour) => (
                    <th key={hour} className="text-center text-xs font-medium text-zinc-500 py-2 px-1">
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.day}>
                    <td className="text-xs font-medium text-zinc-600 py-1 pr-2">{row.day}</td>
                    {row.hours.map((value, idx) => (
                      <td key={idx} className="py-1 px-1">
                        <div
                          className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${getActivityLevel(
                            value
                          )}`}
                        >
                          {value > 0 && value}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-100"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-400"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-600"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-900"></div>
              <span>Peak</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
