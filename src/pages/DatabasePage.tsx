import React, { useEffect, useState } from "react";
import { getGalleryEntries, getGalleryStats, deleteDataset } from "@/lib/api";
import type { GalleryEntry } from "@/types";
import { Trash2, Download, Database, Layers, Camera, ShieldCheck } from "lucide-react";

export const DatabasePage: React.FC = () => {
  const [stats, setStats] = useState<{ total: number; cameras: number; datasets: number; plates: number } | null>(null);
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      const [statsData, entriesData] = await Promise.all([
        getGalleryStats(),
        getGalleryEntries(500, 0),
      ]);
      setStats(statsData);
      setEntries(entriesData);
    } catch (err: any) {
      setError(err.message || "Failed to load database entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const datasets = Array.from(new Set(entries.map((e) => e.dataset)));
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  useEffect(() => {
    if (datasets.length > 0 && !selectedDataset) {
      setSelectedDataset(datasets[0] ?? null);
    }
  }, [datasets, selectedDataset]);

  async function handleDeleteDataset(ds: string) {
    if (!confirm(`Are you sure you want to delete dataset '${ds}'? This will unindex all associated vectors.`)) return;
    try {
      await deleteDataset(ds);
      if (selectedDataset === ds) setSelectedDataset(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  }

  const filteredEntries = entries.filter((e) => e.dataset === selectedDataset);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight text-paper">
          Database Explorer
        </h1>
        <p className="text-sm text-paper/60">
          Hierarchical view of indexed gallery vectors, plate OCR detections, and feature embeddings across camera nodes.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-verdict-reject/30 bg-verdict-reject/10 p-4 text-sm text-verdict-reject">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total Indexed Vectors", value: stats.total, icon: Database, color: "text-accent" },
                { label: "Active Datasets", value: stats.datasets, icon: Layers, color: "text-purple" },
                { label: "Monitored Cameras", value: stats.cameras, icon: Camera, color: "text-emerald-400" },
                { label: "Plates Extracted", value: stats.plates, icon: ShieldCheck, color: "text-amber-400" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="card p-5">
                    <div className="flex items-center justify-between">
                      <span className="label">{stat.label}</span>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="mt-2 text-3xl font-light font-mono text-paper">
                      {stat.value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dataset Selector */}
          <div className="flex flex-wrap gap-2 border-b border-ink-line pb-4">
            {datasets.map((ds) => (
              <button
                key={ds}
                onClick={() => setSelectedDataset(ds)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono transition-colors ${
                  selectedDataset === ds
                    ? "bg-accent text-ink font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    : "bg-ink-soft text-paper/60 hover:bg-ink-line hover:text-paper"
                }`}
              >
                {ds} ({entries.filter((e) => e.dataset === ds).length})
              </button>
            ))}
            {datasets.length === 0 && (
              <div className="text-sm text-paper/50">No datasets available.</div>
            )}
          </div>

          {/* Entries for selected dataset */}
          {selectedDataset && (
            <div className="space-y-6">
              <div className="card p-5 border-accent/20 bg-ink-soft/40">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-light text-paper">
                      Dataset: <span className="text-accent font-semibold">{selectedDataset}</span>
                    </h2>
                    <p className="text-xs text-paper/60">Gallery Vector Summary & Manifest Export</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const headers = ["UID", "Dataset", "Camera", "Plate", "ID", "Visibility"];
                        const csvContent =
                          "data:text/csv;charset=utf-8," +
                          headers.join(",") +
                          "\n" +
                          filteredEntries
                            .map(
                              (e) =>
                                `${e.uid},${e.dataset},${e.camera_id},${e.plate_text || ""},${
                                  e.ground_truth_identity || ""
                                },${e.visibility || ""}`
                            )
                            .join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `${selectedDataset}_export.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Export to CSV
                    </button>
                    <button
                      onClick={() => handleDeleteDataset(selectedDataset)}
                      className="flex items-center gap-1.5 rounded-lg bg-verdict-reject/10 px-3 py-1.5 text-xs text-verdict-reject hover:bg-verdict-reject/20 transition border border-verdict-reject/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-ink-line">
                  <div>
                    <div className="label text-paper/50">Total Entries</div>
                    <div className="font-mono text-xl text-paper mt-1">{filteredEntries.length}</div>
                  </div>
                  <div>
                    <div className="label text-paper/50">Unique Cameras</div>
                    <div className="font-mono text-xl text-purple mt-1">
                      {new Set(filteredEntries.map((e) => e.camera_id)).size}
                    </div>
                  </div>
                  <div>
                    <div className="label text-paper/50">Plates Detected</div>
                    <div className="font-mono text-xl text-amber-300 mt-1">
                      {filteredEntries.filter((e) => e.plate_text).length}
                    </div>
                  </div>
                  <div>
                    <div className="label text-paper/50">Unique Identities</div>
                    <div className="font-mono text-xl text-accent mt-1">
                      {new Set(filteredEntries.map((e) => e.ground_truth_identity).filter(Boolean)).size}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Cards Grid */}
              <div className="card overflow-hidden">
                <div className="border-b border-ink-line bg-ink-soft/50 px-5 py-3 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-paper">
                    Indexed Gallery Sightings ({filteredEntries.length})
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {filteredEntries.map((entry) => (
                      <div
                        key={entry.uid}
                        className="group relative overflow-hidden rounded-xl bg-ink/70 border border-ink-line hover:border-accent/50 transition-all p-3 space-y-3"
                      >
                        <div className="aspect-[4/3] w-full bg-ink-soft rounded-lg overflow-hidden relative border border-ink-line/50">
                          <img
                            src={entry.image_path}
                            alt={entry.uid}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.src = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=60";
                            }}
                          />
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {entry.ground_truth_identity && (
                              <div className="bg-ink/90 backdrop-blur text-[10px] text-accent px-2 py-0.5 rounded border border-accent/30 font-mono shadow">
                                VID: {entry.ground_truth_identity}
                              </div>
                            )}
                            <div className="bg-purple/90 backdrop-blur text-[10px] text-paper px-2 py-0.5 rounded border border-purple/30 font-mono shadow">
                              {entry.camera_id}
                            </div>
                          </div>
                          {entry.visibility !== null && entry.visibility !== undefined && (
                            <div className="absolute bottom-2 left-2 bg-ink/80 backdrop-blur text-[10px] text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                              Vis: {(entry.visibility * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-paper font-semibold truncate max-w-[140px]">
                              {entry.uid}
                            </span>
                            {entry.plate_text ? (
                              <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 text-[11px]">
                                {entry.plate_text}
                              </span>
                            ) : (
                              <span className="text-[10px] text-paper/30 italic">No plate</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-paper/50 pt-1 border-t border-ink-line/50">
                            <span>{entry.dataset}</span>
                            <span>{entry.vehicle_type || "Vehicle"} {entry.color ? `• ${entry.color}` : ""}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
