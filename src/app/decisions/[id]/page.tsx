"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Decision } from "@/types/decision";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function DecisionDetailPage() {
  const params = useParams();
  const decisionId = params.id as string;
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecision() {
      try {
        const res = await fetch(`/api/decisions/${decisionId}`);
        if (res.ok) {
          const data = await res.json();
          setDecision(data);
        }
      } catch (error) {
        console.error("Failed to fetch decision:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDecision();
  }, [decisionId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          <a href="/decisions" className="hover:text-zinc-700">
            Back to Decisions
          </a>
        </div>
        <p className="text-muted-foreground">Decision not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          <a href="/decisions" className="hover:text-zinc-700">
            Back to Decisions
          </a>
        </div>
      </div>

      <DecisionDetail decision={decision} />
    </div>
  );
}
