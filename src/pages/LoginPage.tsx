import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import { KeyRound, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(apiKey);
      navigate("/");
    } catch {
      setError("Invalid API key or session expired");
    } finally {
      setBusy(false);
      setApiKey("");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="card p-6 space-y-4 border-accent/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-semibold text-paper">Operator Authentication</h1>
        </div>
        <p className="text-xs leading-relaxed text-paper/50">
          Enter authorized API key to access live RTSP streams, FAISS embeddings, and evidential calibration controls.
        </p>

        <form onSubmit={submit} className="space-y-4 pt-2">
          <div>
            <label className="label" htmlFor="key">API Key</label>
            <input
              id="key"
              type="password"
              autoComplete="off"
              autoFocus
              className="field mt-1.5 font-mono"
              placeholder="root_secret_dev"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-verdict-reject/30 bg-verdict-reject/10 p-2.5 text-xs text-verdict-reject">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !apiKey}
            className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? "Verifying..." : "Authenticate Session"}
          </button>
        </form>

        <div className="pt-2 border-t border-ink-line text-[11px] text-paper/40 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Role-based access audit enabled</span>
        </div>
      </div>
    </main>
  );
};
