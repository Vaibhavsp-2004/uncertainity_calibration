export type Verdict = "MATCH" | "UNCERTAIN" | "REJECT";

export interface MatchRequest {
  query_id: string;
  similarities: number[];
  candidate_ids: string[];
  visibility: number;
  part_visibility?: number[];
  n_frames: number;
}

export interface MatchResponse {
  verdict: Verdict;
  matched_id: string | null;
  confidence: number;
  temperature: number;
  reason: string;
  model_version: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  model_loaded: boolean;
  calibrator: string;
}

export interface LoginResponse {
  role: string;
  expires_in_seconds: number;
}

export interface SightingResult {
  id?: number;
  image_path: string;
  camera_id: string;
  dataset: string;
  similarity: number;
  confidence: number;
  verdict: "MATCH" | "UNCERTAIN" | "REJECT";
  reason: string;
  plate_text?: string | null;
  plate_confidence?: number | null;
  visibility?: number | null;
  indexed_at?: string | null;
}

export interface GalleryEntry {
  faiss_position: number;
  uid: string;
  image_path: string;
  dataset: string;
  camera_id: string;
  ground_truth_identity?: number | null;
  plate_text?: string | null;
  plate_confidence?: number | null;
  visibility?: number | null;
  indexed_at?: string;
  vehicle_type?: string;
  color?: string;
  brand?: string;
}

export interface IngestionStatus {
  job_id: string;
  status: "queued" | "running" | "done" | "error";
  filename: string;
  total_frames?: number;
  processed_frames?: number;
  detections?: number;
  embeddings?: number;
  elapsed_seconds?: number;
  eta_seconds?: number;
  error?: string;
}

export interface DatasetIngestStatus {
  job_id: string;
  status: "queued" | "running" | "done" | "error";
  dataset_name: string;
  total_images: number;
  processed: number;
  preview_count: number;
  csv_path: string | null;
  errors: string[];
  elapsed_seconds: number;
  error?: string | null;
}

export interface DatasetListEntry {
  dataset_name: string;
  csv_file: string;
  row_count: number;
  preview_count: number;
  created_at: string;
  csv_size_bytes: number;
}

export interface DatasetPreview {
  filename: string;
  path: string;
}

export interface DatasetSearchResult {
  uid: string;
  dataset_name: string;
  split: string;
  identity?: string;
  camera_id?: string;
  plate_text?: string;
  vehicle_type?: string;
  color?: string;
  brand?: string;
  confidence?: string;
  visibility?: string;
  [key: string]: string | undefined;
}

export interface BackendHealth {
  ok: boolean;
  reason?: string;
  status?: string;
}

export type ApiErrorKind = "network" | "not_ready" | "not_found" | "server" | "unknown";
