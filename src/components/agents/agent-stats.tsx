import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentStatsProps {
  totalAgents: number;
  activeNow: number;
  tasksToday: number;
}

export function AgentStats({ totalAgents, activeNow, tasksToday }: AgentStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Total Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">
            {totalAgents}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Active Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">
            {activeNow}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Tasks Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">
            {tasksToday}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
