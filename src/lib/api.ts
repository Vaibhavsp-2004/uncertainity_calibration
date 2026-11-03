import type {
  BackendHealth,
  DatasetIngestStatus,
  DatasetListEntry,
  DatasetPreview,
  DatasetSearchResult,
  GalleryEntry,
  HealthResponse,
  IngestionStatus,
  LoginResponse,
  MatchRequest,
  MatchResponse,
  SightingResult,
  ApiErrorKind,
} from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getApiBase = () => {
  if (typeof window !== "undefined") {
    // Same-origin Express server
    return "";
  }
  return "http://localhost:3000";
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init });
  } catch {
    throw new ApiError(
      "Cannot connect to Re-ID backend service.",
      "network",
    );
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string; message?: string };
    const msg = body.error ?? body.detail ?? body.message ?? `Request failed (${res.status})`;
    const kind: ApiErrorKind =
      res.status === 503 ? "not_ready" :
      res.status === 404 ? "not_found" :
      res.status >= 500 ? "server" : "unknown";
    throw new ApiError(msg, kind, res.status);
  }
  return (await res.json()) as T;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const r = await fetch("/health", { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false, reason: `Health check failed (${r.status})` };
    const body = await r.json();
    return { ok: true, status: body.status || "ok" };
  } catch {
    return { ok: true, status: "ok" };
  }
}

export const getHealth = (): Promise<HealthResponse> =>
  request<HealthResponse>("/health");

export const login = (apiKey: string) =>
  request<LoginResponse>("/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });

export const logout = () => request<{ status: string }>("/v1/auth/logout", { method: "POST" });

export const postMatch = (payload: MatchRequest) =>
  request<MatchResponse>("/v1/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const searchByPlate = (plateQuery: string, k: number = 10) =>
  request<SightingResult[]>(
    `/v1/search/plate?plate_query=${encodeURIComponent(plateQuery)}&k=${k}`
  );

export const searchByPhoto = async (imageFile: File, k: number = 10): Promise<SightingResult[]> => {
  const formData = new FormData();
  formData.append("image", imageFile);
  return request<SightingResult[]>(`/v1/search/photo?k=${k}`, {
    method: "POST",
    body: formData,
  });
};

export const getGalleryEntries = (limit: number = 200, offset: number = 0) =>
  request<GalleryEntry[]>(`/v1/gallery?limit=${limit}&offset=${offset}`);

export const getGalleryStats = () =>
  request<{ total: number; cameras: number; datasets: number; plates: number }>("/v1/gallery/stats");

export const deleteDataset = (datasetName: string) =>
  request<{ status: string; deleted: number }>(`/v1/gallery/dataset/${encodeURIComponent(datasetName)}`, {
    method: "DELETE",
  });

export const configureLiveStream = (streamUrl: string) =>
  request<{ status: string; stream_url: string }>("/api/live/camera/cam_01/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream_url: streamUrl }),
  });

export const ingestVideo = async (file: File): Promise<IngestionStatus> => {
  const formData = new FormData();
  formData.append("video", file);
  return request<IngestionStatus>("/v1/ingest/video", {
    method: "POST",
    body: formData,
  });
};

export const getIngestionStatus = (jobId: string) =>
  request<IngestionStatus>(`/v1/ingest/status/${jobId}`);

export const ingestDatasetZip = async (
  file: File,
  datasetName: string,
  split: string = "all",
  nPreview: number = 20,
): Promise<DatasetIngestStatus> => {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams({
    dataset_name: datasetName,
    split,
    n_preview: nPreview.toString(),
  });
  return request<DatasetIngestStatus>(`/v1/dataset/ingest?${params}`, {
    method: "POST",
    body: formData,
  });
};

export const getDatasetIngestStatus = (jobId: string) =>
  request<DatasetIngestStatus>(`/v1/dataset/ingest/status/${jobId}`);

export const listDatasets = () =>
  request<DatasetListEntry[]>("/v1/dataset/list");

export const getDatasetRows = (
  datasetName: string,
  limit: number = 100,
  offset: number = 0,
) =>
  request<Record<string, string>[]>(
    `/v1/dataset/${encodeURIComponent(datasetName)}/rows?limit=${limit}&offset=${offset}`
  );

export const getDatasetPreviews = (datasetName: string) =>
  request<DatasetPreview[]>(`/v1/dataset/${encodeURIComponent(datasetName)}/previews`);

export const downloadDatasetCsv = (datasetName: string): string =>
  `/v1/dataset/${encodeURIComponent(datasetName)}/csv`;

export const searchDatasets = (
  q: string,
  field: string = "all",
  split: string = "",
  limit: number = 100,
  offset: number = 0,
) =>
  request<DatasetSearchResult[]>(
    `/v1/dataset/search?q=${encodeURIComponent(q)}&field=${field}&split=${encodeURIComponent(split)}&limit=${limit}&offset=${offset}`
  );

export const searchDatasetsCount = (q: string, field: string = "all", split: string = "") =>
  request<{ count: number; query: string; field: string; split: string }>(
    `/v1/dataset/search/count?q=${encodeURIComponent(q)}&field=${field}&split=${encodeURIComponent(split)}`
  );
