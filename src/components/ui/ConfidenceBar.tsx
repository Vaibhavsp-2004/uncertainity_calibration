import React from "react";

interface ConfidenceBarProps {
  confidence: number;
  label?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence, label }) => {
  const pct = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  const color =
    confidence >= 0.85
      ? "bg-verdict-match text-verdict-match"
      : confidence >= 0.5
      ? "bg-verdict-uncertain text-verdict-uncertain"
      : "bg-verdict-reject text-verdict-reject";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="label">{label || "Calibrated Confidence"}</span>
        <span className={`font-mono font-bold ${color.split(" ")[1]}`}>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink border border-ink-line">
        <div
          className={`h-full transition-all duration-500 ease-out ${color.split(" ")[0]}`}
          style={{ width: `${pct}%`, boxShadow: `0 0 10px currentColor` }}
        />
      </div>
    </div>
  );
};
