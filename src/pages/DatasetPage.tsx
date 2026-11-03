import React, { useState, useRef, useEffect } from "react";
import {
  listDatasets,
  ingestDatasetZip,
  getDatasetIngestStatus,
  getDatasetRows,
  downloadDatasetCsv,
  checkBackendHealth,
} from "@/lib/api";
import type {
  DatasetListEntry,
  DatasetIngestStatus,
  BackendHealth,
} from "@/types";
import { Download, RefreshCw, Filter, Search, UploadCloud, CheckCircle, Database } from "lucide-react";

// Utilities
function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const COL_LABELS: Record<string, string> = {
  uid: "UID",
  dataset_name: "Dataset",
  split: "Split",
  relative_path: "Path",
  identity: "Identity",
  camera_id: "Camera",
  frame_id: "Frame",
  sequence_id: "Seq",
  vehicle_type: "Type",
  color: "Color",
  brand: "Brand",
  plate_text: "Plate",
  plate_confidence: "Plate Conf",
  visibility: "Visibility",
  width: "W",
  height: "H",
  file_size_bytes: "Size",
  timestamp: "Timestamp",
};

const SPLIT_COLORS: Record<string, string> = {
  train: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  query: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  gallery: "bg-green-500/20 text-green-300 border-green-500/30",
  all: "bg-accent/20 text-accent border-accent/30",
};

function CellBadge({ col, value }: { col: string; value: string }) {
  if (col === "split") {
    const cls = SPLIT_COLORS[value] ?? "bg-ink-line text-paper/60 border-ink-line";
    return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>{value || "—"}</span>;
  }
  if (col === "vehicle_type") {
    const icons: Record<string, string> = { sedan: "🚗", suv: "🚙", truck: "🚚", van: "🚐", bus: "🚌", motorcycle: "🏍", pickup: "🛻" };
    return <span className="text-[11px] text-paper/80">{icons[value.toLowerCase()] ?? "🚘"} {value}</span>;
  }
  if (col === "color") {
    const swatches: Record<string, string> = {
      black: "#111", white: "#eee", silver: "#aaa", red: "#e44", blue: "#44e",
      green: "#4a4", yellow: "#ee4", gray: "#888", brown: "#964", gold: "#ca4",
    };
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-paper/80">
        <span className="w-2.5 h-2.5 rounded-full border border-ink-line inline-block" style={{ background: swatches[value.toLowerCase()] ?? "#666" }} />
        {value}
      </span>
    );
  }
  if (col === "visibility") {
    const num = parseFloat(value);
    return isNaN(num) ? <span>{value}</span> : (
      <span className={`font-mono text-[11px] ${num >= 0.8 ? "text-emerald-400" : num >= 0.5 ? "text-amber-400" : "text-rose-400"}`}>
        {(num * 100).toFixed(0)}%
      </span>
    );
  }
  return <span>{value || "—"}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <span className="label text-paper/50">{label}</span>
      <span className="text-2xl font-bold font-mono text-accent">{value}</span>
      {sub && <span className="text-xs text-paper/40">{sub}</span>}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink border border-ink-line">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300"
        style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(0,240,255,0.6)" }}
      />
    </div>
  );
}

function IngestPanel({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [split, setSplit] = useState("all");
  const [nPreview, setNPreview] = useState(20);
  const [dragging, setDragging] = useState(false);
  const [job, setJob] = useState<DatasetIngestStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => { if (pollRef.current) clearInterval(pollRef.current); };

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") {
      stopPoll();
      if (job?.status === "done") onDone();
      return;
    }
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getDatasetIngestStatus(job.job_id);
        setJob(s);
      } catch {}
    }, 800);
    return stopPoll;
  }, [job?.job_id, job?.status]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.(zip|tar\.gz)$/i, "").replace(/[^A-Za-z0-9_-]/g, "_"));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await ingestDatasetZip(file, name || "dataset", split, nPreview);
      setJob(result);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setName("");
    setJob(null);
    setError(null);
  };

  return (
    <div className="card p-6 space-y-5">
      <h2 className="text-sm font-semibold tracking-widest text-paper/80 uppercase flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-accent" /> Ingest New Dataset Archive
      </h2>
      {!job && (
        <>
          <div
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              dragging
                ? "border-accent bg-accent/10 scale-[1.01]"
                : file
                ? "border-accent/50 bg-accent/5"
                : "border-ink-line bg-ink/50 hover:border-accent/30 hover:bg-ink-soft"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".zip,.tar.gz"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!name) setName(f.name.replace(/\.zip$/i, "").replace(/[^A-Za-z0-9_-]/g, "_"));
                }
              }}
            />
            {file ? (
              <div className="text-center">
                <div className="mb-2 text-4xl">📦</div>
                <div className="font-semibold text-paper">{file.name}</div>
                <div className="text-xs text-accent mt-1">{fmtBytes(file.size)}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-2 text-4xl text-paper/30">🗂</div>
                <div className="font-medium text-paper">Drop a ZIP or TAR archive here, or click to browse</div>
                <div className="text-xs text-paper/50 mt-1">Supports VeRi-776, VeriWild, CityFlow, or raw vehicle image folders</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label block mb-1">Dataset Name</label>
              <input
                type="text"
                className="field"
                placeholder="e.g. veri776_custom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label block mb-1">Split</label>
              <select className="field" value={split} onChange={(e) => setSplit(e.target.value)}>
                <option value="all">All / Unspecified</option>
                <option value="train">Train</option>
                <option value="gallery">Gallery</option>
                <option value="query">Query</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1">Preview Thumbnails</label>
              <input
                type="number"
                min={5}
                max={100}
                className="field"
                value={nPreview}
                onChange={(e) => setNPreview(Number(e.target.value))}
              />
            </div>
          </div>

          {error && <div className="p-3 text-xs text-verdict-reject bg-verdict-reject/10 border border-verdict-reject/30 rounded-lg">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            {uploading ? "Ingesting Archive..." : "Start Ingestion & Manifest Generation"}
          </button>
        </>
      )}

      {job && (
        <div className="space-y-4 rounded-lg bg-ink/60 p-5 border border-ink-line">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase text-accent">
              Processing: {job.dataset_name} ({job.status})
            </span>
            <span className="text-xs font-mono text-paper/60">{job.elapsed_seconds.toFixed(1)}s elapsed</span>
          </div>

          <ProgressBar value={job.processed} max={job.total_images || 100} />

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>Processed: {job.processed} / {job.total_images}</div>
            <div>Previews: {job.preview_count}</div>
            <div>Status: <span className="text-accent uppercase">{job.status}</span></div>
          </div>

          {job.status === "done" && (
            <div className="p-3 bg-verdict-match/10 border border-verdict-match/30 text-verdict-match text-xs rounded-lg flex items-center justify-between">
              <span>✓ Ingestion complete. Manifest indexed.</span>
              <button onClick={reset} className="btn-primary py-1 px-3 text-[11px]">Ingest Another</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DatasetPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetListEntry[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [splitFilter, setSplitFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  const refreshDatasets = async () => {
    setLoading(true);
    try {
      const list = await listDatasets();
      setDatasets(list);
      if (list.length > 0 && (!selectedDataset || !list.find((d) => d.dataset_name === selectedDataset))) {
        setSelectedDataset(list[0]?.dataset_name ?? null);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDatasets();
  }, []);

  useEffect(() => {
    if (!selectedDataset) {
      setRows([]);
      return;
    }
    getDatasetRows(selectedDataset, 200, 0)
      .then(setRows)
      .catch(() => setRows([]));
  }, [selectedDataset]);

  const currentDataset = datasets.find((d) => d.dataset_name === selectedDataset);

  const filteredRows = rows.filter((r) => {
    if (splitFilter !== "all" && r.split !== splitFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        (r.plate_text && r.plate_text.toLowerCase().includes(q)) ||
        (r.identity && r.identity.toLowerCase().includes(q)) ||
        (r.camera_id && r.camera_id.toLowerCase().includes(q)) ||
        (r.vehicle_type && r.vehicle_type.toLowerCase().includes(q)) ||
        (r.color && r.color.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight text-paper">
          Dataset Manager
        </h1>
        <p className="text-sm text-paper/60">
          Upload and inspect VeRi-776 / VeriWild benchmark archives, verify bounding boxes, and explore tabular camera manifests.
        </p>
      </header>

      {/* Ingest Panel */}
      <IngestPanel onDone={refreshDatasets} />

      {/* Dataset Selection Tabs & Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-ink-line pb-3">
          <div className="flex flex-wrap gap-2">
            {datasets.map((d) => (
              <button
                key={d.dataset_name}
                onClick={() => setSelectedDataset(d.dataset_name)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono transition-all ${
                  selectedDataset === d.dataset_name
                    ? "bg-accent text-ink font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    : "bg-ink-soft text-paper/60 hover:text-paper hover:bg-ink-line"
                }`}
              >
                {d.dataset_name} ({d.row_count})
              </button>
            ))}
          </div>
          <button
            onClick={refreshDatasets}
            className="text-xs text-accent/80 hover:text-accent flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {currentDataset && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Images" value={currentDataset.row_count} />
            <StatCard label="Cached Previews" value={currentDataset.preview_count} />
            <StatCard label="Manifest Size" value={fmtBytes(currentDataset.csv_size_bytes)} />
            <StatCard label="Created" value={fmtDate(currentDataset.created_at).split(",")[0] ?? ""} />
          </div>
        )}
      </div>

      {/* Table & Filtering */}
      {selectedDataset && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-line bg-ink-soft/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-paper/40" />
                <input
                  type="text"
                  placeholder="Filter by plate, ID, camera, color, or vehicle type..."
                  className="field pl-9 py-1.5 text-xs"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              <select
                className="field w-32 py-1.5 text-xs"
                value={splitFilter}
                onChange={(e) => setSplitFilter(e.target.value)}
              >
                <option value="all">All Splits</option>
                <option value="train">Train</option>
                <option value="gallery">Gallery</option>
                <option value="query">Query</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-paper/50">
                Showing {filteredRows.length} of {rows.length} rows
              </span>
              <a
                href={downloadDatasetCsv(selectedDataset)}
                download={`${selectedDataset}_manifest.csv`}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </a>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-ink-soft text-[10px] uppercase tracking-wider text-accent border-b border-ink-line z-10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">UID</th>
                  <th className="p-3">Identity</th>
                  <th className="p-3">Camera</th>
                  <th className="p-3">Split</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/50">
                {filteredRows.map((row, idx) => (
                  <tr key={row.uid || idx} className="hover:bg-ink-soft/40 transition">
                    <td className="p-3 text-paper/40 font-mono text-[10px]">{idx + 1}</td>
                    <td className="p-3 font-mono text-paper font-semibold">{row.uid}</td>
                    <td className="p-3 font-mono text-accent">{row.identity || "—"}</td>
                    <td className="p-3 font-mono text-purple">{row.camera_id || "—"}</td>
                    <td className="p-3"><CellBadge col="split" value={row.split || "all"} /></td>
                    <td className="p-3 font-mono text-amber-300 font-bold">{row.plate_text || "—"}</td>
                    <td className="p-3"><CellBadge col="vehicle_type" value={row.vehicle_type || ""} /></td>
                    <td className="p-3"><CellBadge col="color" value={row.color || ""} /></td>
                    <td className="p-3"><CellBadge col="visibility" value={row.visibility || "1.0"} /></td>
                    <td className="p-3 font-mono text-[10px] text-paper/40 truncate max-w-xs">{row.relative_path}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-paper/40">
                      No matching records found.
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
