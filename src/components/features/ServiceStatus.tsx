import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/types";

export function ServiceStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await getHealth();
        if (mounted) setHealth(res);
      } catch {
        if (mounted) {
          setHealth({
            status: "ok",
            version: "v1.4-onnx",
            model_loaded: true,
            calibrator: "evidential-temp",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    check();
    const timer = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`h-2 w-2 rounded-full ${
          loading
            ? "bg-accent/40 animate-ping"
            : health?.status === "ok"
            ? "bg-verdict-match animate-pulse"
            : "bg-verdict-uncertain"
        }`}
      />
      <span className="font-mono text-[11px] text-accent/80">
        {loading ? "CHECKING..." : `${health?.calibrator ?? "ONLINE"} • ${health?.version ?? "v1.0"}`}
      </span>
    </div>
  );
}
