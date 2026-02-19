'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineStage, PipelineItem } from '@/types/builds';
import { GitBranch, Zap, Shield } from 'lucide-react';

const AGENT_COLORS = {
  cipher: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  spark: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  flux: { bg: 'bg-zinc-100', text: 'text-[#FFE135]', border: 'border-zinc-300' },
};

const STATUS_COLORS = {
  queued: 'bg-zinc-100 text-zinc-600',
  speccing: 'bg-zinc-100 text-zinc-700',
  building: 'bg-zinc-100 text-zinc-700',
  qa: 'bg-zinc-100 text-[#FFE135]',
  shipped: 'bg-zinc-100 text-zinc-700',
  failed: 'bg-red-100 text-red-700',
};

export function PipelineView() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline');
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'cipher': return <GitBranch className="h-3.5 w-3.5" />;
      case 'spark': return <Zap className="h-3.5 w-3.5" />;
      case 'flux': return <Shield className="h-3.5 w-3.5" />;
      default: return <GitBranch className="h-3.5 w-3.5" />;
    }
  };

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Pipeline
          <span className="ml-2 text-xs text-zinc-500 font-normal">
            Cipher → Spark → Flux
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {stages.map((stage) => {
            const colors = AGENT_COLORS[stage.agent];
            return (
              <div key={stage.name} className={`flex-shrink-0 w-48 border rounded-lg ${colors.border}`}>
                <div className={`px-3 py-2 border-b ${colors.bg} ${colors.text} text-xs font-medium flex items-center gap-1.5`}>
                  {getAgentIcon(stage.agent)}
                  <span>{stage.name}</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-white/50 rounded text-[10px]">
                    {stage.items.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                  {stage.items.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-2">Empty</p>
                  ) : (
                    stage.items.map((item: PipelineItem) => (
                      <div key={item.id} className="space-y-1">
                        <p className="text-xs font-medium text-zinc-800 line-clamp-2">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[item.status]}`}>
                            {item.status}
                          </span>
                          <span className="text-[10px] text-zinc-400">{item.priority}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
