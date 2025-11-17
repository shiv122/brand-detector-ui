/**
 * API Client for Detector Backend
 * Centralized API client with proper error handling and TypeScript types
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface VideoFrameData {
  type: "status" | "frame" | "complete" | "video_ready" | "download_status" | "error" | "summary";
  frame_number?: number;
  frame_url?: string;
  detections?: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    class_id: number;
    class_name: string;
    classification?: Array<{
      class_id: number;
      class_name: string;
      confidence: number;
    }>;
  }>;
  total_detections?: number;
  timestamp?: number;
  message?: string;
  total_frames?: number;
  estimated_total_frames?: number;
  processed_video_url?: string;
  logo_counts?: Record<string, number>;
  session_summary?: {
    session_id: string;
    total_frames_processed: number;
    logo_totals: Record<string, number>;
    total_detections: number;
    unique_logos: string[];
    realtime_csv_files?: Record<string, string>;
  };
  // Fields for "summary" type messages
  session_id?: string;
  total_frames_processed?: number;
  logo_totals?: Record<string, number>;
  realtime_csv_files?: Record<string, string>;
  percentage?: number;
  status?: string;
}

export interface ConfigData {
  frames_per_second: number;
  confidence_threshold: number;
}

export interface WeightInfo {
  name: string;
  path: string;
  size: number;
  description?: string;
}

export interface WeightsResponse {
  available_weights: WeightInfo[];
  current_weight: string;
}

export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  class_id: number;
  class_name: string;
}

export interface DetectionResult {
  detections: Detection[];
  total_detections: number;
  image_size?: [number, number];
  annotated_image?: string;
  error?: string;
}

export interface MultipleImagesResponse {
  results: DetectionResult[];
}

export interface SessionSummary {
  session_id: string;
  total_frames_processed: number;
  logo_totals: Record<string, number>;
  total_detections: number;
  unique_logos: string[];
  realtime_csv_files?: Record<string, string>;
}

export interface CSVExportResponse {
  message: string;
  csv_files: Record<string, string>;
  session_id: string;
}

export interface CSVFile {
  filename: string;
  path: string;
  size: number;
  created: string;
}

export interface Classification {
  class_id: number;
  class_name: string;
  confidence: number;
}

export interface ClassificationResult {
  classifications: Classification[];
  top_prediction?: Classification;
  filename: string;
  error?: string;
}

export interface ClassificationResponse {
  results: ClassificationResult[];
}

export interface DashboardStats {
  overview: {
    total_detections: number;
    images_processed: number;
    videos_processed: number;
    total_sessions: number;
    total_assets: number;
  };
  top_brands: Array<{
    name: string;
    detections: number;
    percentage: number;
  }>;
  top_assets: Array<{
    name: string;
    count: number;
  }>;
  assets_per_brand: Record<string, Array<{
    asset_name: string;
    count: number;
  }>>;
  detection_types: {
    video: number;
    image: number;
  };
  recent_activity: Array<{
    id: number;
    session_id: string;
    type: "video" | "image";
    name: string;
    detections: number;
    status: string;
    created_at: string;
  }>;
  processing_queue: Array<{
    session_id: string;
    name: string;
    progress: number;
    status: string;
  }>;
  brand_distribution: Array<{
    date: string;
    [brandName: string]: string | number;
  }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || "An error occurred",
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 500,
      };
    }
  }

  // Health and Config
  async getHealth() {
    return this.request<{ status: string; model_loaded: boolean }>("/health");
  }

  async getConfig() {
    return this.request<ConfigData>("/config");
  }

  async updateConfig(config: ConfigData) {
    return this.request("/config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Weight Management
  async getWeights() {
    return this.request<WeightsResponse>("/weights");
  }

  async switchWeight(weightName: string) {
    return this.request("/weights/switch", {
      method: "POST",
      body: JSON.stringify({ weight_name: weightName }),
    });
  }

  // Image Detection
  async detectMultipleImages(files: File[], confidenceThreshold: number) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("confidence_threshold", confidenceThreshold.toString());

      const url = `${this.baseUrl}/images/detect`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || "Image processing failed",
          status: response.status,
        };
      }

      return {
        data: data as MultipleImagesResponse,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 500,
      };
    }
  }

  // Video Detection - Streaming
  async streamVideo(
    file: File | null,
    fileUrl: string | null,
    framesPerSecond: number,
    confidenceThreshold: number,
    createVideo: boolean = false,
    enableClassification: boolean = false,
    callbacks: {
      onData?: (data: VideoFrameData) => void;
      onError?: (error: string) => void;
      onComplete?: () => void;
      onDownloadProgress?: (progress: { percentage: number; status: string }) => void;
      onDownloadComplete?: () => void;
    } = {}
  ): Promise<void> {
    try {
      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      } else if (fileUrl) {
        formData.append("file_url", fileUrl);
      } else {
        callbacks.onError?.("Either file or file_url must be provided");
        return;
      }

      formData.append("frames_per_second", framesPerSecond.toString());
      formData.append("confidence_threshold", confidenceThreshold.toString());
      formData.append("create_video", createVideo.toString());
      formData.append("enable_classification", enableClassification.toString());

      const url = `${this.baseUrl}/video/detect`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        callbacks.onError?.(errorData.detail || "Video processing failed");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.("Failed to create stream reader");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let downloadCompleteSent = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          callbacks.onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as VideoFrameData;

              if (data.type === "download_status") {
                callbacks.onDownloadProgress?.({
                  percentage: data.percentage || 0,
                  status: data.status || "",
                });

                if (data.percentage && data.percentage >= 100 && !downloadCompleteSent) {
                  downloadCompleteSent = true;
                  callbacks.onDownloadComplete?.();
                }
              } else if (data.type === "error") {
                callbacks.onError?.(data.message || "An error occurred");
                return;
              } else {
                callbacks.onData?.(data);
              }
            } catch (e) {
              console.warn("Failed to parse SSE data:", line);
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error.message : "Network error");
    }
  }

  // Session Management
  async getSessionSummary(sessionId: string) {
    return this.request<SessionSummary>(`/session/${sessionId}/summary`);
  }

  async getDashboardStats() {
    return this.request<DashboardStats>("/dashboard/stats");
  }

  async getRealtimeCSVFiles(sessionId: string) {
    return this.request<{ csv_files: Record<string, string>; session_id: string }>(
      `/session/${sessionId}/realtime-csv`
    );
  }

  async exportSessionToCSV(sessionId: string, filenamePrefix?: string) {
    return this.request<CSVExportResponse>("/session/export-csv", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        filename_prefix: filenamePrefix,
      }),
    });
  }

  async getAvailableCSVFiles() {
    return this.request<{ csv_files: CSVFile[] }>("/csv-files");
  }

  downloadCSVFile(filename: string) {
    const url = `${this.baseUrl}/csv-files/download/${filename}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async cleanupOldCSVFiles(maxFiles: number = 50) {
    return this.request(`/csv-files/cleanup?max_files=${maxFiles}`, {
      method: "DELETE",
    });
  }

  // Classification
  async getClassificationWeights() {
    return this.request<WeightsResponse>("/classification/weights");
  }

  async switchClassificationWeight(weightName: string) {
    return this.request("/classification/weights/switch", {
      method: "POST",
      body: JSON.stringify({ weight_name: weightName }),
    });
  }

  async classifyImages(files: File[], topK: number = 5) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("top_k", topK.toString());

      const url = `${this.baseUrl}/classification/images/classify`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || "Image classification failed",
          status: response.status,
        };
      }

      return {
        data: data as ClassificationResponse,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 500,
      };
    }
  }
}

export const apiClient = new ApiClient();

