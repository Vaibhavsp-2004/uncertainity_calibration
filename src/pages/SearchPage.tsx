import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, Crosshair, Upload, AlertTriangle, Database, Camera, Image as ImageIcon } from "lucide-react";
import { MatchConsole } from "@/components/features/MatchConsole";
import {
  searchByPlate,
  searchByPhoto,
  searchDatasets,
  checkBackendHealth,
} from "@/lib/api";
import type {
  SightingResult,
  DatasetSearchResult,
  BackendHealth,
} from "@/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";

type SearchMode = "plate" | "photo" | "csv";
type SearchStatus = "idle" | "searching" | "done" | "error";

function confidenceColor(c: number): string {
  if (c >= 0.85) return "text-emerald-400";
  if (c >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

export const SearchPage: React.FC = () => {
  const [mode, setMode] = useState<SearchMode>("plate");
  const [plateQuery, setPlateQuery] = useState("粤B7");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // CSV query state
  const [csvQuery, setCsvQuery] = useState("");
  const [colorFilter, setColorFilter] = useState("Any Color");
  const [typeFilter, setTypeFilter] = useState("Any Type");
  const [splitFilter, setSplitFilter] = useState("all");

  // Results
  const [sightingResults, setSightingResults] = useState<SightingResult[]>([]);
  const [csvResults, setCsvResults] = useState<DatasetSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Perform initial sample search
    handlePlateSearch("B");
  }, []);

  async function handlePlateSearch(q?: string) {
    const target = q ?? plateQuery;
    if (!target.trim()) return;
    setStatus("searching");
    setError(null);
    try {
      const results = await searchByPlate(target, 12);
      setSightingResults(results);
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Failed to execute plate search");
      setStatus("error");
    }
  }

  async function handlePhotoSearch(file: File) {
    setStatus("searching");
    setError(null);
    try {
      const results = await searchByPhoto(file, 12);
      setSightingResults(results);
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Failed to execute photo search");
      setStatus("error");
    }
  }

  async function handleCsvSearch() {
    setStatus("searching");
    setError(null);
    try {
      const results = await searchDatasets(csvQuery, "all", splitFilter === "all" ? "" : splitFilter, 50, 0);
      let filtered = results;
      if (colorFilter !== "Any Color") {
        filtered = filtered.filter((r) => r.color?.toLowerCase() === colorFilter.toLowerCase());
      }
      if (typeFilter !== "Any Type") {
        filtered = filtered.filter((r) => r.vehicle_type?.toLowerCase() === typeFilter.toLowerCase());
      }
      setCsvResults(filtered);
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Failed to execute dataset search");
      setStatus("error");
    }
  }

  const onPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedPhoto(f);
      const url = URL.createObjectURL(f);
      setPhotoPreview(url);
      handlePhotoSearch(f);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-accent/20 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-paper">
            Multi-Modal Search Console
          </h1>
          <p className="mt-1.5 text-sm text-paper/60">
            Query vehicles across multi-camera network via license plate text, query probe photos, or attribute manifests.
          </p>
        </div>
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
            showConsole
              ? "bg-accent text-ink border-accent shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              : "bg-ink-soft text-accent border-accent/30 hover:border-accent hover:bg-accent/10"
          }`}
        >
          {showConsole ? "Hide Evidential Calibrator" : "Open Evidential Calibrator"}
        </button>
      </header>

      {/* Evidential Calibrator Drawer */}
      {showConsole && (
        <div className="card p-6 border-accent/40 bg-ink-soft/70">
          <div className="flex items-center justify-between mb-4">
            <span className="label text-accent">RE-ID UNCERTAINTY CALIBRATION TESTBED</span>
            <span className="text-[11px] font-mono text-paper/50">Algorithm: Visibility-Weighted Temperature Scaling</span>
          </div>
          <MatchConsole />
        </div>
      )}

      {/* Search Mode Tabs */}
      <div className="card p-6 space-y-6">
        <div className="flex border-b border-ink-line gap-4 text-xs uppercase tracking-wider font-semibold">
          <button
            onClick={() => setMode("plate")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              mode === "plate" ? "border-accent text-accent font-bold" : "border-transparent text-paper/50 hover:text-paper"
            }`}
          >
            <Search className="w-3.5 h-3.5" /> License Plate Query
          </button>
          <button
            onClick={() => setMode("photo")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              mode === "photo" ? "border-accent text-accent font-bold" : "border-transparent text-paper/50 hover:text-paper"
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Photo Probe Re-ID
          </button>
          <button
            onClick={() => setMode("csv")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              mode === "csv" ? "border-accent text-accent font-bold" : "border-transparent text-paper/50 hover:text-paper"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Attribute & Manifest Query
          </button>
        </div>

        {/* Plate Search Form */}
        {mode === "plate" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter plate substring (e.g. 粤B, WA12, B782)..."
                  className="field py-3 pl-4 font-mono text-sm uppercase tracking-wider"
                  value={plateQuery}
                  onChange={(e) => setPlateQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePlateSearch()}
                />
              </div>
              <button
                onClick={() => handlePlateSearch()}
                disabled={status === "searching"}
                className="btn-primary px-6"
              >
                {status === "searching" ? "Searching..." : "Search Plates"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-paper/50 items-center">
              <span>Quick tests:</span>
              {["粤B782X", "WA1234", "京A099", "B782", "川A"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setPlateQuery(t);
                    handlePlateSearch(t);
                  }}
                  className="px-2 py-0.5 rounded bg-ink border border-ink-line font-mono text-accent/80 hover:border-accent/40"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Search Form */}
        {mode === "photo" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-accent/30 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-ink/40 hover:border-accent/60 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoSelect}
              />
              <Upload className="w-8 h-8 text-accent/60 mb-3" />
              <div className="text-sm font-semibold text-paper">Select Probe Crop Image</div>
              <p className="text-xs text-paper/40 mt-1">Upload vehicle patch to extract TransReID 768-D embeddings</p>
            </div>

            {photoPreview && (
              <div className="col-span-2 card p-4 flex items-center gap-5 border-accent/30">
                <div className="w-32 h-24 rounded-lg overflow-hidden border border-ink-line bg-ink-soft flex-shrink-0">
                  <img src={photoPreview} alt="Probe" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="label text-accent">Active Query Probe</div>
                  <div className="font-mono text-sm text-paper">{selectedPhoto?.name}</div>
                  <div className="text-xs text-paper/50">
                    Resolution: 256x256 • ResNet-IBN / ViT Extractor Active
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-accent underline mt-2 inline-block"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV Manifest Search */}
        {mode === "csv" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="label block mb-1">Search Keywords</label>
                <input
                  type="text"
                  placeholder="ID, Plate, Camera, or Model..."
                  className="field text-xs"
                  value={csvQuery}
                  onChange={(e) => setCsvQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="label block mb-1">Color</label>
                <select className="field text-xs" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                  {["Any Color", "black", "white", "silver", "red", "blue", "gray"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-1">Vehicle Type</label>
                <select className="field text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  {["Any Type", "sedan", "suv", "truck", "van", "bus"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleCsvSearch} className="btn-primary py-2 px-6 text-xs">
              Filter Records
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Sighting Results for Plate or Photo */}
      {(mode === "plate" || mode === "photo") && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-line bg-ink-soft/50 p-4 flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-wider text-paper uppercase">
              Matching Vehicle Sightings ({sightingResults.length})
            </h3>
            <span className="text-xs font-mono text-paper/40">Sorted by Calibrated Confidence</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-ink-soft text-[10px] uppercase tracking-wider text-accent border-b border-ink-line">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Camera Node</th>
                  <th className="p-3">Dataset</th>
                  <th className="p-3">Plate OCR</th>
                  <th className="p-3 text-right">Similarity</th>
                  <th className="p-3 text-right">Calibrated Confidence</th>
                  <th className="p-3 text-center">Decision Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {sightingResults.map((item, idx) => (
                  <tr
                    key={item.id ?? idx}
                    className={`hover:bg-ink-soft/40 transition ${
                      item.verdict === "UNCERTAIN"
                        ? "bg-amber-500/5"
                        : item.verdict === "MATCH"
                        ? "bg-emerald-500/5"
                        : ""
                    }`}
                  >
                    <td className="p-3 text-center font-mono text-paper/40">{idx + 1}</td>
                    <td className="p-3 font-mono text-purple font-semibold">
                      {item.camera_id}
                      {item.verdict === "UNCERTAIN" && (
                        <span className="block text-[9px] text-amber-400 font-bold mt-0.5">
                          ⚠ HUMAN AUDIT REQD
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-paper/60 uppercase text-[11px]">{item.dataset}</td>
                    <td className="p-3 font-mono text-amber-300 font-bold tracking-wider">
                      {item.plate_text || <span className="text-paper/30 italic">None</span>}
                    </td>
                    <td className="p-3 text-right font-mono text-paper/70">
                      {(item.similarity * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-mono text-sm font-bold ${confidenceColor(item.confidence)}`}>
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <VerdictBadge verdict={item.verdict} />
                    </td>
                  </tr>
                ))}
                {sightingResults.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-paper/40">
                      No matching records found. Enter another plate or photo query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Results */}
      {mode === "csv" && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-line bg-ink-soft/50 p-4">
            <h3 className="text-sm font-semibold tracking-wider text-paper uppercase">
              Manifest Search Results ({csvResults.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-ink-soft text-[10px] uppercase tracking-wider text-accent border-b border-ink-line">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Identity</th>
                  <th className="p-3">Camera</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">Vehicle Type</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Split</th>
                  <th className="p-3">Dataset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {csvResults.map((r, i) => (
                  <tr key={i} className="hover:bg-ink-soft/40 transition">
                    <td className="p-3 text-paper/40 font-mono">{i + 1}</td>
                    <td className="p-3 font-mono text-accent font-semibold">{r.identity || "—"}</td>
                    <td className="p-3 font-mono text-purple">{r.camera_id || "—"}</td>
                    <td className="p-3 font-mono text-amber-300 font-bold">{r.plate_text || "—"}</td>
                    <td className="p-3 text-paper/80 capitalize">{r.vehicle_type || "—"}</td>
                    <td className="p-3 text-paper/80 capitalize">{r.color || "—"}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-ink-line border border-accent/20 text-accent">
                        {r.split}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-paper/50">{r.dataset_name}</td>
                  </tr>
                ))}
                {csvResults.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-paper/40">
                      No manifest entries match current query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
