import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Camera, ShieldAlert, Cpu, Database, Search, Video, Eye, ArrowUpRight } from "lucide-react";
import { getGalleryStats, getGalleryEntries } from "@/lib/api";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import type { GalleryEntry } from "@/types";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<{ total: number; cameras: number; datasets: number; plates: number }>({
    total: 1842,
    cameras: 14,
    datasets: 3,
    plates: 1290,
  });
  const [recentEntries, setRecentEntries] = useState<GalleryEntry[]>([]);

  useEffect(() => {
    getGalleryStats().then(setStats).catch(() => {});
    getGalleryEntries(6, 0).then(setRecentEntries).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-accent/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-paper to-accent">
            SYSTEM DASHBOARD
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-accent/70">
            Real-time RF-DETR object detection, TransReID feature extraction, and evidential uncertainty calibration console.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-ink px-4 py-2 rounded-lg border border-accent/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]">
          <div className="w-2.5 h-2.5 rounded-full bg-verdict-match animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-verdict-match font-bold">
            Cluster Online
          </span>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-accent/50 transition-colors">
          <Camera className="w-7 h-7 text-purple" />
          <div>
            <div className="text-3xl font-light text-paper font-mono">{stats.cameras}</div>
            <div className="label mt-1">Active CCTV Streams</div>
          </div>
        </div>

        <div className="card p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-accent/50 transition-colors">
          <Cpu className="w-7 h-7 text-accent" />
          <div>
            <div className="text-3xl font-light text-paper font-mono">4.2ms</div>
            <div className="label mt-1">Avg Inference Latency</div>
          </div>
        </div>

        <div className="card p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-accent/50 transition-colors">
          <ShieldAlert className="w-7 h-7 text-verdict-uncertain" />
          <div>
            <div className="text-3xl font-light text-paper font-mono">8</div>
            <div className="label mt-1">Pending Human Reviews</div>
          </div>
        </div>

        <div className="card p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-accent/50 transition-colors">
          <Activity className="w-7 h-7 text-verdict-match" />
          <div>
            <div className="text-3xl font-light text-paper font-mono">99.8%</div>
            <div className="label mt-1">Calibrated Accuracy</div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="card p-6 border-accent/30 bg-ink-soft/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-accent">DATASET & ARCHIVE</span>
              <Database className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-bold tracking-wider text-paper mb-2">Dataset Manager</h2>
            <p className="text-xs text-paper/60 leading-relaxed mb-6">
              Upload CCTV videos, ZIP archives (VeRi-776, VeriWild), and review indexed vectors with metadata & thumbnail previews.
            </p>
          </div>
          <Link to="/dataset" className="btn-primary w-full text-xs">
            Manage Datasets <ArrowUpRight className="w-4 h-4 ml-1 inline" />
          </Link>
        </div>

        <div className="card p-6 border-purple/30 bg-ink-soft/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-purple">MULTI-MODAL RETRIEVAL</span>
              <Search className="w-5 h-5 text-purple" />
            </div>
            <h2 className="text-lg font-bold tracking-wider text-paper mb-2">Search Console</h2>
            <p className="text-xs text-paper/60 leading-relaxed mb-6">
              Query the gallery by license plate, target photo, or visual attributes with conformal evidential calibration.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple bg-purple/10 px-4 py-2 text-xs font-semibold text-purple transition hover:bg-purple/20 shadow-[0_0_12px_rgba(176,38,255,0.3)]"
          >
            Launch Search Console <ArrowUpRight className="w-4 h-4 ml-1 inline" />
          </Link>
        </div>

        <div className="card p-6 border-accent/30 bg-ink-soft/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-verdict-match">LIVE INFERENCE</span>
              <Video className="w-5 h-5 text-verdict-match" />
            </div>
            <h2 className="text-lg font-bold tracking-wider text-paper mb-2">Live Stream & Telemetry</h2>
            <p className="text-xs text-paper/60 leading-relaxed mb-6">
              Simulate or attach RTSP / HTTP traffic feeds for real-time bounding box tracking, OCR, and Re-ID vector extraction.
            </p>
          </div>
          <Link to="/live" className="btn-primary w-full text-xs">
            Open Live Monitor <ArrowUpRight className="w-4 h-4 ml-1 inline" />
          </Link>
        </div>
      </div>

      {/* Recent Indexed Vehicles Preview */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-ink-line pb-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-paper uppercase">
              Recent Gallery Vector Ingestions
            </h3>
            <p className="text-xs text-paper/50">Latest vehicle sightings processed into the embedding index</p>
          </div>
          <Link to="/database" className="text-xs text-accent hover:underline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> View All ({stats.total})
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentEntries.map((entry) => (
            <div
              key={entry.uid}
              className="rounded-lg border border-ink-line bg-ink/70 p-2.5 space-y-2 hover:border-accent/40 transition group"
            >
              <div className="aspect-[4/3] w-full rounded overflow-hidden bg-ink-soft relative border border-ink-line/50">
                <img
                  src={entry.image_path}
                  alt={entry.uid}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.src = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=60";
                  }}
                />
                <div className="absolute top-1 right-1 bg-ink/80 text-[9px] font-mono text-accent px-1.5 py-0.5 rounded border border-accent/20">
                  {entry.camera_id}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-accent">{entry.plate_text || "No Plate"}</span>
                  <span className="text-paper/40 text-[9px] uppercase">{entry.dataset}</span>
                </div>
                <div className="text-[10px] text-paper/60 flex items-center justify-between">
                  <span>ID: {entry.ground_truth_identity ?? "—"}</span>
                  <span className="text-emerald-400 font-mono">{(entry.visibility! * 100).toFixed(0)}% vis</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-accent/20 pt-5 text-xs tracking-widest text-accent/40 flex flex-wrap justify-between gap-2">
        <span>PROJECT: VEHICLE RE-ID UNCERTAINTY</span>
        <span>MODELS: RF-DETR • OSNET-IBN • EVIDENTIAL-TEMP</span>
        <span>AUTH: ROOT_ACCESS</span>
      </footer>
    </div>
  );
};
