"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { QueuedSpec } from "@/lib/build-mock";

interface BuildQueueProps {
  queue: QueuedSpec[];
}

export function BuildQueue({ queue }: BuildQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📋 Build Queue
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            + Add Spec
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <p className="text-sm text-zinc-500">No specs in queue</p>
        ) : (
          <div className="space-y-4">
            {queue.map((item, index) => (
              <div
                key={item.id}
                className="border border-zinc-200 rounded-lg p-4 space-y-2"
              >
                {/* Queue number and name */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-zinc-500 font-mono">
                      Spec: {item.specPath}
                    </p>
                  </div>
                </div>

                {/* Estimate and actions */}
                <div className="flex items-center justify-between ml-11">
                  <span className="text-sm text-zinc-600">
                    Est: {item.estimatedDuration}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Edit
                    </Button>
                    <Button variant="default" size="sm" className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800">
                      Spawn Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
