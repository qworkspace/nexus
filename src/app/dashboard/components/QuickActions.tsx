"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Play, 
  Zap, 
  FileText, 
  OctagonX 
} from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">QUICK ACTIONS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4 hover:border-zinc-300"
          >
            <Plus className="h-4 w-4 mr-3 text-zinc-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-900">Spawn Dev Agent</p>
              <p className="text-xs text-zinc-500 mt-0.5">Create a new task agent</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4 hover:border-zinc-300"
          >
            <Play className="h-4 w-4 mr-3 text-zinc-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-900">Run Cron Now</p>
              <p className="text-xs text-zinc-500 mt-0.5">Trigger any scheduled job</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4 hover:border-zinc-300"
          >
            <Zap className="h-4 w-4 mr-3 text-zinc-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-900">Switch Model</p>
              <p className="text-xs text-zinc-500 mt-0.5">Change AI model for main session</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4 hover:border-zinc-300"
          >
            <FileText className="h-4 w-4 mr-3 text-zinc-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-900">View Logs</p>
              <p className="text-xs text-zinc-500 mt-0.5">Open log viewer</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-auto py-3 px-4 hover:border-red-200 hover:bg-red-50"
          >
            <OctagonX className="h-4 w-4 mr-3 text-red-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-red-600">Emergency Stop</p>
              <p className="text-xs text-red-400 mt-0.5">Kill all spawned sessions</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
