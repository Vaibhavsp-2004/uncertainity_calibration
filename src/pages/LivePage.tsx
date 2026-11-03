import React, { useEffect, useState, useRef } from "react";
import { configureLiveStream } from "@/lib/api";
import { Video, Radio, Settings, Play, Pause, Camera } from "lucide-react";

interface LiveVehicle {
  vehicle_id: string;
  type: string;
  track_id: number;
  confidence: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  plate?: string;
  color?: string;
}

export const LivePage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([
    { vehicle_id: "VID_0482", type: "Sedan", track_id: 14, confidence: 0.94, plate: "粤B782X", color: "#38bdf8" },
    { vehicle_id: "VID_0891", type: "SUV", track_id: 18, confidence: 0.88, plate: "WA1234", color: "#e2e8f0" },
    { vehicle_id: "VID_0114", type: "Truck", track_id: 22, confidence: 0.76, plate: "京A9901", color: "#ef4444" },
  ]);
  const [fps, setFps] = useState(29);
  const [streamUrl, setStreamUrl] = useState("rtsp://cctv-cam04.traffic.hub/live");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simVehiclesRef = useRef<
    Array<{
      id: string;
      plate: string;
      type: string;
      color: string;
      x: number;
      y: number;
      w: number;
      h: number;
      speed: number;
      lane: number;
      conf: number;
      trackId: number;
    }>
  >([
    { id: "VID_0482", plate: "粤B782X", type: "Sedan", color: "#38bdf8", x: 80, y: 160, w: 120, h: 70, speed: 1.4, lane: 1, conf: 0.94, trackId: 14 },
    { id: "VID_0891", plate: "WA1234", type: "SUV", color: "#e2e8f0", x: 260, y: 120, w: 140, h: 80, speed: 1.8, lane: 2, conf: 0.88, trackId: 18 },
    { id: "VID_0114", plate: "京A9901", type: "Truck", color: "#f87171", x: 480, y: 220, w: 160, h: 90, speed: 1.1, lane: 3, conf: 0.76, trackId: 22 },
  ]);

  useEffect(() => {
    // Attempt WebSocket connection to /api/live/ws/vehicles
    let ws: WebSocket | null = null;
    try {
      const loc = window.location;
      const wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${loc.host}/api/live/ws/vehicles`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.vehicles) setVehicles(data.vehicles);
        } catch {}
      };
    } catch {
      setIsConnected(true);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Continuous CCTV Canvas Simulation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let frames = 0;

    const render = (time: number) => {
      frames++;
      if (time - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = time;
      }

      const w = (canvas.width = 800);
      const h = (canvas.height = 450);

      // Background - Dark CCTV Highway perspective
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, w, h);

      // Perspective Road
      ctx.fillStyle = "#0c1220";
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h);
      ctx.lineTo(w * 0.35, h * 0.25);
      ctx.lineTo(w * 0.65, h * 0.25);
      ctx.lineTo(w * 0.9, h);
      ctx.closePath();
      ctx.fill();

      // Road boundary lines
      ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h);
      ctx.lineTo(w * 0.35, h * 0.25);
      ctx.moveTo(w * 0.9, h);
      ctx.lineTo(w * 0.65, h * 0.25);
      ctx.stroke();

      // Lane dividers (dashed)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(w * 0.37, h);
      ctx.lineTo(w * 0.45, h * 0.25);
      ctx.moveTo(w * 0.63, h);
      ctx.lineTo(w * 0.55, h * 0.25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Horizon & Cityscape backdrop
      ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
      ctx.fillRect(0, 0, w, h * 0.25);

      // Update & Draw Simulated Vehicles
      simVehiclesRef.current.forEach((veh) => {
        if (!isPaused) {
          veh.y += veh.speed;
          // Scale size by perspective
          const scale = 0.4 + (veh.y / h) * 0.9;
          const currentW = veh.w * scale;
          const currentH = veh.h * scale;

          if (veh.y > h + 50) {
            veh.y = h * 0.25;
            veh.x = w * 0.35 + Math.random() * (w * 0.25);
          }

          // Vehicle box body
          ctx.save();
          ctx.fillStyle = "rgba(10, 16, 30, 0.9)";
          ctx.strokeStyle = veh.conf >= 0.85 ? "#00f0ff" : "#f59e0b";
          ctx.lineWidth = 2;
          ctx.strokeRect(veh.x, veh.y, currentW, currentH);
          ctx.fillRect(veh.x, veh.y, currentW, currentH);

          // Headlights glow
          ctx.fillStyle = "rgba(255, 255, 200, 0.3)";
          ctx.beginPath();
          ctx.arc(veh.x + 12, veh.y + currentH, 8 * scale, 0, Math.PI * 2);
          ctx.arc(veh.x + currentW - 12, veh.y + currentH, 8 * scale, 0, Math.PI * 2);
          ctx.fill();

          // Reticle corners
          const rSize = 8;
          ctx.strokeStyle = "#00f0ff";
          ctx.lineWidth = 2;
          // top-left
          ctx.beginPath();
          ctx.moveTo(veh.x, veh.y + rSize);
          ctx.lineTo(veh.x, veh.y);
          ctx.lineTo(veh.x + rSize, veh.y);
          ctx.stroke();

          // Overlay Tag
          ctx.fillStyle = "rgba(5, 8, 16, 0.85)";
          ctx.fillRect(veh.x, veh.y - 20, currentW, 18);
          ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.strokeRect(veh.x, veh.y - 20, currentW, 18);

          ctx.fillStyle = "#00f0ff";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`${veh.plate} • ${(veh.conf * 100).toFixed(0)}%`, veh.x + 4, veh.y - 7);

          ctx.restore();
        }
      });

      // CCTV HUD Overlay
      ctx.fillStyle = "rgba(0, 240, 255, 0.7)";
      ctx.font = "11px monospace";
      ctx.fillText(`CAM_04 [NORTH INTERCHANGE] • ${new Date().toLocaleTimeString()}`, 16, 26);
      ctx.fillText(`REC ● 1080p @ 30FPS | RF-DETR + TRANSREID`, 16, 42);

      // Crosshair in center
      ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 15, h / 2);
      ctx.lineTo(w / 2 + 15, h / 2);
      ctx.moveTo(w / 2, h / 2 - 15);
      ctx.lineTo(w / 2, h / 2 + 15);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  async function applyStreamUrl(url: string) {
    setIsConfiguring(true);
    try {
      setStreamUrl(url);
      await configureLiveStream(url);
    } catch {
      // Graceful
    } finally {
      setIsConfiguring(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap justify-between items-end gap-4 border-b border-accent/20 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-paper">
            Live Surveillance Feed
          </h1>
          <p className="text-sm text-paper/60">
            Real-time multi-target tracking (ByteTrack), plate OCR gating, and online vector re-identification.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-ink px-3 py-1.5 rounded-lg border border-accent/20">
            <span className="h-2.5 w-2.5 rounded-full bg-verdict-match animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-accent font-bold">
              STREAM ACTIVE
            </span>
          </div>
          <div className="text-xs font-mono text-paper/60 bg-ink px-3 py-1.5 rounded-lg border border-ink-line">
            FPS: <span className="text-emerald-400 font-bold">{fps}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CCTV Player Canvas */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden relative">
            <canvas
              ref={canvasRef}
              className="w-full aspect-video object-contain bg-black rounded-lg"
            />
            {/* Play/Pause control pill */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-ink/90 backdrop-blur px-3 py-1.5 rounded-lg border border-accent/30 shadow-lg">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-xs text-accent hover:text-paper flex items-center gap-1 font-mono"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {isPaused ? "RESUME" : "PAUSE"}
              </button>
            </div>
          </div>
        </div>

        {/* Control and Stats Sidebar */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Stream Config */}
          <div className="card p-5 border-accent/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
              <Settings className="w-4 h-4 text-accent" />
              Stream Configuration
            </h3>

            <div className="space-y-3">
              <div>
                <label className="label block mb-1.5">Stream Source URL (RTSP / HTTP / WebCam)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    className="field font-mono text-xs"
                    placeholder="e.g. rtsp://... or 0"
                  />
                  <button
                    onClick={() => applyStreamUrl(streamUrl)}
                    disabled={isConfiguring}
                    className="btn-primary py-1.5 px-3 text-xs whitespace-nowrap"
                  >
                    {isConfiguring ? "..." : "Apply"}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-ink-line">
                <label className="label block mb-2">Preset Feeds</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyStreamUrl("0")}
                    className="py-1.5 px-2.5 text-xs bg-ink/60 border border-ink-line rounded-lg hover:border-accent/40 text-paper/80 transition text-center"
                  >
                    Webcam (0)
                  </button>
                  <button
                    onClick={() => applyStreamUrl("rtsp://cctv-cam04.traffic.hub/live")}
                    className="py-1.5 px-2.5 text-xs bg-ink/60 border border-ink-line rounded-lg hover:border-accent/40 text-paper/80 transition text-center"
                  >
                    City Traffic RTSP
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Subjects Panel */}
          <div className="card p-5 border-accent/20 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ink-line mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-paper/70">
                Active Tracking Targets
              </span>
              <span className="font-mono text-lg text-accent font-bold">{vehicles.length}</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[260px] pr-1">
              {vehicles.map((v, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-accent/10 bg-ink/60 flex items-center justify-between hover:border-accent/30 transition"
                >
                  <div>
                    <div className="text-xs font-mono text-paper font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: v.color || "#00f0ff" }} />
                      {v.plate || v.vehicle_id}
                    </div>
                    <div className="text-[10px] text-paper/50 uppercase tracking-wider mt-0.5">
                      {v.type} • Track #{v.track_id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="label text-[9px]">Conf</div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      {(v.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
