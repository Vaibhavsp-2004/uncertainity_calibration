# 🚘 Vehicle Re-ID Uncertainty Platform (React SPA + Express)

> **Uncertainty-calibrated, multi-camera vehicle re-identification with risk-bounded abstention (`MATCH / UNCERTAIN / REJECT`), CSV dataset pipeline, and cyber-surveillance management console.**

---

## 🗺️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION & PROCESSING                          │
│                                                                              │
│   Video / RTSP ──▶ RF-DETR Detector ──▶ SAM 2.1 Segmenter ──▶ ByteTrack    │
│   ZIP / Images ──▶ Dataset Processor ──▶ CSV Manifest (veri776_*.csv)       │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────┐
│                      FEATURE EXTRACTION & CALIBRATION                        │
│                                                                              │
│   Occlusion / Visibility Estimator ──▶ TransReID / ResNet-IBN Encoder       │
│   Camera Descriptor ──▶ Conditional Temperature Scaling T(v, c)             │
│   ──▶ Calibrated Confidence ──▶ Evidential Risk Estimator                    │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────┐
│                       ABSTENTION & DECISION LAYER                            │
│                                                                              │
│   Confidence ≥ θ_high  ──▶  ✅ MATCH                                        │
│   θ_low ≤ Conf < θ_high ──▶  ⚠️  UNCERTAIN  (human adjudication queue)      │
│   Confidence < θ_low   ──▶  ❌ REJECT                                        │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────┐
│                          SERVING & WEB CONSOLE                               │
│                                                                              │
│   Express Backend (:3000) ── /v1/match /v1/search /v1/dataset /v1/gallery    │
│   React SPA (:3000)       ── Dashboard · Dataset · Search · Live Feed · Ingest│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Dashboard**: Real-time cluster health, active cameras, inference latency, pending review counters, and gallery preview.
- **Dataset Manager**: Ingest ZIP archives (VeRi-776, VeriWild, CityFlow), inspect tabular manifests with badge attributes, split filtering, and CSV export.
- **Database Explorer**: Vector embeddings browser with vehicle thumbnails, OCR license plate badges, camera IDs, and deletion tools.
- **Search Console**: Tri-modal search — query by license plate OCR text, query by vehicle crop probe image (TransReID cosine similarity), or filter attributes with Evidential Temperature Scaling testbed.
- **Video Ingestion**: Automated pipeline extracting vehicle tracklets and embeddings from uploaded surveillance footage.
- **Live Stream**: Real-time simulated & RTSP-compatible CCTV traffic monitor with dynamic ByteTrack bounding boxes, live tracking telemetry, and WebSocket streaming.
- **Authentication**: Role-based access with API key authorization.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Express, WebSocket (`ws`), Multer
- **Port**: 3000 (unified full-stack development and production)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Build for production
npm run build
```
