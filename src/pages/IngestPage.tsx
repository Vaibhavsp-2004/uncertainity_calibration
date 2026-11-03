import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ingestVideo, getIngestionStatus } from "@/lib/api";
import type { IngestionStatus } from "@/types";
import { UploadCloud, CheckCircle, Video, Database, Search, Cpu } from "lucide-react";

export const IngestPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll status when jobId is active
  useEffect(() => {
    if (!jobId || (status?.status === "done" || status?.status === "error")) return;

    const interval = setInterval(async () => {
      try {
        const s = await getIngestionStatus(jobId);
        setStatus(s);
      } catch (err: any) {
        console.error("Failed to poll status:", err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [jobId, status?.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0] ?? null);
      setError(null);
      setJobId(null);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const res = await ingestVideo(file);
      setJobId(res.job_id);
      setStatus(res);
    } catch (err: any) {
      setError(err.message || "Failed to start ingestion");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight text-paper">
          Video Ingestion Pipeline
        </h1>
        <p className="text-sm text-paper/60">
          Upload CCTV footage to automatically extract bounding boxes, tracklets, plate OCR, and TransReID embeddings using the 2-stage (RF-DETR + OSNet) pipeline.
        </p>
      </header>

      <div className="card p-6 space-y-6">
        {/* Upload Zone */}
        <div
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            file
              ? "border-accent/60 bg-accent/5"
              : "border-ink-line bg-ink/50 hover:border-accent/40 hover:bg-ink-soft"
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading || status?.status === "running"}
          />

          {file ? (
            <div className="text-center">
              <div className="mb-2 text-4xl text-accent">📹</div>
              <div className="font-semibold text-paper text-sm">{file.name}</div>
              <div className="text-xs text-accent/80 font-mono mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-2 text-4xl text-paper/30">🎬</div>
              <div className="font-medium text-paper text-sm">Click to upload CCTV video stream</div>
              <div className="text-xs text-paper/50 mt-1">MP4, AVI, MKV up to 500MB supported</div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-verdict-reject/10 p-3 text-xs text-verdict-reject border border-verdict-reject/30">
            {error}
          </div>
        )}

        {/* Upload Button */}
        {!jobId && (
          <button
            className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading Footage...
              </span>
            ) : (
              "Start Ingestion & Tracking"
            )}
          </button>
        )}

        {/* Progress Tracking */}
        {status && (
          <div className="space-y-4 rounded-lg bg-ink/80 p-5 border border-ink-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-paper uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                Status:{" "}
                <span
                  className={
                    status.status === "running"
                      ? "text-accent animate-pulse"
                      : status.status === "done"
                      ? "text-verdict-match"
                      : status.status === "error"
                      ? "text-verdict-reject"
                      : "text-paper"
                  }
                >
                  {status.status.toUpperCase()}
                </span>
              </h3>
              {status.eta_seconds !== null && status.status === "running" && (
                <span className="text-xs font-mono text-accent">
                  ETA: {Math.ceil(status.eta_seconds ?? 0)}s
                </span>
              )}
            </div>

            {(status.status === "running" || status.status === "done") && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink border border-ink-line">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{
                      width: `${
                        status.total_frames
                          ? Math.min(100, Math.round((status.processed_frames! / status.total_frames) * 100))
                          : 0
                      }%`,
                      boxShadow: "0 0 10px rgba(0,240,255,0.7)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                  <div className="p-2.5 rounded bg-ink-soft border border-ink-line">
                    <div className="label text-paper/50">Frames</div>
                    <div className="font-mono text-sm text-paper mt-0.5">
                      {status.processed_frames} / {status.total_frames}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-ink-soft border border-ink-line">
                    <div className="label text-paper/50">Detections</div>
                    <div className="font-mono text-sm text-accent mt-0.5">{status.detections}</div>
                  </div>
                  <div className="p-2.5 rounded bg-ink-soft border border-ink-line">
                    <div className="label text-paper/50">Vectors Indexed</div>
                    <div className="font-mono text-sm text-purple mt-0.5">{status.embeddings}</div>
                  </div>
                  <div className="p-2.5 rounded bg-ink-soft border border-ink-line">
                    <div className="label text-paper/50">Elapsed</div>
                    <div className="font-mono text-sm text-paper mt-0.5">
                      {Math.round(status.elapsed_seconds || 0)}s
                    </div>
                  </div>
                </div>
              </>
            )}

            {status.error && (
              <div className="text-xs text-verdict-reject p-3 rounded bg-verdict-reject/10 border border-verdict-reject/30">
                Error: {status.error}
              </div>
            )}

            {status.status === "done" && (
              <div className="mt-6 border-t border-ink-line pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-verdict-match">
                  <CheckCircle className="h-4 w-4" />
                  Processing complete. Vehicle sightings indexed into FAISS gallery.
                </div>
                <div className="card p-4 border-accent/20 bg-ink-soft/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-paper/60">Source Footage:</span>
                    <span className="font-mono text-paper">{status.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-paper/60">Frames Processed:</span>
                    <span className="font-mono text-paper">{status.processed_frames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-paper/60">Sightings Indexed:</span>
                    <span className="font-mono text-accent">{status.embeddings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-paper/60">Processing Rate:</span>
                    <span className="font-mono text-emerald-400">
                      {((status.processed_frames || 1) / Math.max(1, status.elapsed_seconds || 1)).toFixed(1)} fps
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <Link to="/database" className="btn-primary flex-1 py-2 text-xs text-center">
                    <Database className="w-3.5 h-3.5 inline mr-1" /> View in Database
                  </Link>
                  <Link
                    to="/search"
                    className="flex-1 rounded-lg border border-purple bg-purple/10 py-2 text-xs text-purple font-semibold text-center hover:bg-purple/20 transition"
                  >
                    <Search className="w-3.5 h-3.5 inline mr-1" /> Search Plate/Photo
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
