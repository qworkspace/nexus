"use client";

import { Decision, ExtendedOutcome } from "@/types/decision";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OutcomeValidator } from "./OutcomeValidator";
import { calculateSuccessScore, formatStatus, formatImpactLevel } from "@/app/decisions/lib/decision-utils";

interface DecisionDetailProps {
  decision: Decision;
}

export function DecisionDetail({ decision }: DecisionDetailProps) {
  const timestamp = new Date(decision.timestamp * 1000);
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });

  const extendedContext = decision.extendedContext;
  const implementation = decision.implementation;
  const outcomes = decision.extendedOutcomes || [];
  const successScore = decision.successScore ?? calculateSuccessScore(outcomes);
  const status = decision.status || 'pending';
  const impactLevel = decision.impactLevel || 'medium';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
            {decision.title || decision.decision.action}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-zinc-500">{relativeTime}</span>
            <Badge variant="secondary">{decision.agent}</Badge>
            <Badge>{formatStatus(status)}</Badge>
            <Badge variant="outline">{formatImpactLevel(impactLevel)}</Badge>
            {successScore > 0 && (
              <Badge className="bg-zinc-100 text-zinc-700">
                Score: {successScore}/100
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Description */}
      {extendedContext?.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-zinc-700">{extendedContext.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Context Section */}
      {extendedContext && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reasoning */}
            {extendedContext.reasoning && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Why This Decision?</h4>
                <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">
                  {extendedContext.reasoning}
                </p>
              </div>
            )}

            {/* Alternatives */}
            {extendedContext.alternatives && extendedContext.alternatives.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 mb-2">Alternatives Considered</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
                  {extendedContext.alternatives.map((alt, i) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Implementation Section */}
      {implementation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {implementation.spec && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Spec</h4>
                  <p className="text-sm text-zinc-700 font-mono">{implementation.spec}</p>
                </div>
              )}
              {implementation.buildId && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Build</h4>
                  <p className="text-sm text-zinc-700 font-mono">#{implementation.buildId}</p>
                </div>
              )}
              {implementation.deployedAt && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-zinc-500 mb-1">Deployed</h4>
                  <p className="text-sm text-zinc-700">
                    {new Date(implementation.deployedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcomes Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Outcomes</CardTitle>
          <OutcomeValidator decision={decision} />
        </CardHeader>
        <CardContent>
          {outcomes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p className="mb-2">No outcomes defined</p>
              <p className="text-sm">Expected outcomes will be added during implementation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="p-4 border border-zinc-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-zinc-900">{outcome.metric}</h4>
                    <OutcomeStatusBadge status={outcome.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Target</p>
                      <p className="font-medium text-zinc-900">
                        {outcome.target} {outcome.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Actual</p>
                      <p className="font-medium text-zinc-900">
                        {outcome.status === 'pending' ? '—' : `${outcome.value} ${outcome.unit}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Measured</p>
                      <p className="text-zinc-700">
                        {new Date(outcome.measuredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Success Score Summary */}
              <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Overall Success Score</p>
                    <p className="text-2xl font-semibold text-zinc-900">
                      {successScore}/100
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">
                      {outcomes.filter(o => o.status === 'passed').length} of {outcomes.length} passed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OutcomeStatusBadge({ status }: { status: ExtendedOutcome['status'] }) {
  const config = {
    pending: { icon: Clock, label: 'Pending', className: 'bg-zinc-100 text-[#FFE135]' },
    passed: { icon: CheckCircle, label: 'Passed', className: 'bg-zinc-100 text-zinc-700' },
    failed: { icon: XCircle, label: 'Failed', className: 'bg-red-100 text-red-700' },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
