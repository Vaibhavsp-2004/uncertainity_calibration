import { useState } from "react";
import { postMatch, ApiError } from "@/lib/api";
import type { MatchResponse } from "@/types";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { VerdictBadge } from "@/components/ui/VerdictBadge";

const DEMO_SIMS = "0.94, 0.88, 0.81, 0.77, 0.71";

export function MatchConsole() {
  const [queryId, setQueryId] = useState("c012_q0001");
  const [sims, setSims] = useState(DEMO_SIMS);
  const [visibility, setVisibility] = useState(0.85);
  const [frames, setFrames] = useState(12);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [humanDecision, setHumanDecision] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setHumanDecision(null);
    try {
      const similarities = sims
        .split(",")
        .map((s) => Number.parseFloat(s.trim()))
        .filter((n) => Number.isFinite(n));
      if (similarities.length === 0) throw new Error("Enter at least one similarity score");
      const res = await postMatch({
        query_id: queryId,
        similarities,
        candidate_ids: similarities.map((_, i) => `g${String(i).padStart(4, "0")}`),
        visibility,
        n_frames: frames,
      });
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setError("Unauthorized: Please sign in or use a valid API key");
        return;
      }
      setError((e as Error).message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1.05fr_1fr]">
      <section className="card p-5">
        <h2 className="text-sm font-medium text-paper">Query Parameters</h2>
        <p className="mt-1 text-xs leading-relaxed text-paper/60">
          Visibility comes from the segmentation mask. Lowering it widens the evidential
          predicted temperature and pulls confidence down, even when similarity scores do not move.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="qid">Query ID</label>
            <input
              id="qid"
              className="field mt-1.5 font-mono"
              value={queryId}
              maxLength={128}
              onChange={(e) => setQueryId(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="sims">Top-K Similarities (Descending)</label>
            <input
              id="sims"
              className="field mt-1.5 font-mono"
              value={sims}
              onChange={(e) => setSims(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="vis">Visible Fraction (Mask Gating)</label>
              <span className="font-mono text-xs text-accent">{visibility.toFixed(2)}</span>
            </div>
            <input
              id="vis"
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={visibility}
              onChange={(e) => setVisibility(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
          </div>

          <div>
            <label className="label" htmlFor="frames">Tracklet Length (Frames)</label>
            <input
              id="frames"
              type="number"
              min={1}
              max={10000}
              className="field mt-1.5 font-mono"
              value={frames}
              onChange={(e) => setFrames(Number(e.target.value))}
            />
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="w-full btn-primary font-bold tracking-widest disabled:opacity-50"
          >
            {busy ? "SCORING MATCH..." : "SCORE THIS MATCH"}
          </button>
        </div>
      </section>

      <section className="card flex flex-col p-5">
        <h2 className="text-sm font-medium text-paper">Evidential Decision</h2>

        {error && (
          <p className="mt-4 rounded-lg border border-verdict-reject/30 bg-verdict-reject/10 p-3 text-xs text-verdict-reject">
            {error}
          </p>
        )}

        {!result && !error && (
          <div className="mt-8 flex flex-col items-center justify-center text-center opacity-60">
            <div className="h-10 w-10 rounded-full border border-dashed border-accent/40 flex items-center justify-center text-accent mb-2">
              ⚖
            </div>
            <p className="text-xs text-paper/50">Submit a query above to see calibrated Re-ID decision.</p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <VerdictBadge verdict={result.verdict} />
              <span className="font-mono text-[11px] text-paper/40">Model: {result.model_version}</span>
            </div>

            <ConfidenceBar confidence={result.confidence} />

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <Stat label="Matched ID" value={result.matched_id ?? "None"} />
              <Stat label="Temperature (T)" value={result.temperature.toFixed(3)} />
              <Stat label="Raw Top-1" value={sims.split(",")[0]?.trim() ?? "—"} />
              <Stat label="Decision Rule" value={result.confidence >= 0.85 ? "Accepted" : result.confidence >= 0.5 ? "Abstention" : "Rejected"} />
            </dl>

            <div className="rounded-lg border border-ink-line bg-ink/60 p-3">
              <p className="label">Decision Reasoning</p>
              <p className="mt-1.5 text-xs leading-relaxed text-paper/80 font-mono">{result.reason}</p>
            </div>

            {result.verdict === "UNCERTAIN" && (
              <div className="space-y-2 pt-2 border-t border-ink-line">
                <div className="text-[11px] text-verdict-uncertain font-medium">
                  ⚠ Conformal Prediction Abstention: Manual verification required.
                </div>
                {humanDecision ? (
                  <div className="p-2 rounded bg-accent/10 border border-accent/30 text-xs text-accent">
                    Human Analyst Action: <strong className="font-bold">{humanDecision}</strong> recorded in audit log.
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHumanDecision("CONFIRMED MATCH")}
                      className="flex-1 rounded-lg border border-verdict-match/40 bg-verdict-match/10 px-3 py-2 text-xs font-semibold text-verdict-match transition hover:bg-verdict-match/20"
                    >
                      ✓ Confirm Match
                    </button>
                    <button
                      onClick={() => setHumanDecision("REJECTED")}
                      className="flex-1 rounded-lg border border-verdict-reject/40 bg-verdict-reject/10 px-3 py-2 text-xs font-semibold text-verdict-reject transition hover:bg-verdict-reject/20"
                    >
                      ✕ Reject Match
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-ink/50 border border-ink-line">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-paper/90">{value}</dd>
    </div>
  );
}
