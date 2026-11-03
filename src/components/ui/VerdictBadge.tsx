import React from "react";
import type { Verdict } from "@/types";

interface VerdictBadgeProps {
  verdict: Verdict | string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict }) => {
  const norm = verdict.toUpperCase();
  if (norm === "MATCH") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-verdict-match/40 bg-verdict-match/15 px-3 py-1 font-mono text-xs font-bold text-verdict-match shadow-[0_0_8px_rgba(16,185,129,0.25)]">
        <span className="h-1.5 w-1.5 rounded-full bg-verdict-match animate-pulse" />
        MATCH
      </span>
    );
  }
  if (norm === "UNCERTAIN") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-verdict-uncertain/40 bg-verdict-uncertain/15 px-3 py-1 font-mono text-xs font-bold text-verdict-uncertain shadow-[0_0_8px_rgba(245,158,11,0.25)]">
        <span className="h-1.5 w-1.5 rounded-full bg-verdict-uncertain animate-ping" />
        UNCERTAIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-verdict-reject/40 bg-verdict-reject/15 px-3 py-1 font-mono text-xs font-bold text-verdict-reject">
      <span className="h-1.5 w-1.5 rounded-full bg-verdict-reject" />
      REJECT
    </span>
  );
};
