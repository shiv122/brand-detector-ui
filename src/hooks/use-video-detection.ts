/**
 * Hook for video detection with streaming support
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { apiClient, type VideoFrameData } from "@/lib/api-client";
import { useConfig, useUpdateConfig } from "./use-api";
import { toast } from "sonner";

export interface VideoDetectionState {
  isProcessing: boolean;
  frames: VideoFrameData[];
  currentFrame: VideoFrameData | null;
  progress: number;
  totalFrames: number;
  sessionId: string | null;
  processedVideoUrl: string | null;
  logoCounts: Record<string, number>;
  downloadProgress: { percentage: number; status: string } | null;
  isVideoCreating: boolean;
  isVideoProcessing: boolean;
  realtimeCsvFiles: Record<string, string>;
}

export function useVideoDetection() {
  const { data: configData } = useConfig();
  const updateConfigMutation = useUpdateConfig();

  const [inputType, setInputType] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [framesPerSecond, setFramesPerSecond] = useState("5");
  const [confidenceThreshold, setConfidenceThreshold] = useState("0.5");
  const [createVideo, setCreateVideo] = useState(false);
  const [enableClassification, setEnableClassification] = useState(true);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [state, setState] = useState<VideoDetectionState>({
    isProcessing: false,
    frames: [],
    currentFrame: null,
    progress: 0,
    totalFrames: 0,
    sessionId: null,
    processedVideoUrl: null,
    logoCounts: {},
    downloadProgress: null,
    isVideoCreating: false,
    isVideoProcessing: false,
    realtimeCsvFiles: {},
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load config from API on mount
  useEffect(() => {
    if (configData?.data && !isConfigLoaded && isMounted) {
      const config = configData.data;
      setFramesPerSecond(config.frames_per_second.toString());
      setConfidenceThreshold(config.confidence_threshold.toString());
      setIsConfigLoaded(true);
    }
  }, [configData, isConfigLoaded, isMounted]);

  // Load user preferences from localStorage (client-side only, after config is loaded)
  useEffect(() => {
    if (isMounted && !isConfigLoaded && !configData?.data) {
      try {
        const savedFPS = localStorage.getItem("detector-fps");
        const savedConfidence = localStorage.getItem("detector-confidence");
        if (savedFPS) setFramesPerSecond(savedFPS);
        if (savedConfidence) setConfidenceThreshold(savedConfidence);
      } catch (e) {
        console.warn("Could not load user preferences:", e);
      }
    }
  }, [isConfigLoaded, configData, isMounted]);

  // Update config when values change
  const handleFramesPerSecondChange = useCallback(
    (value: string) => {
      setFramesPerSecond(value);
      if (isMounted) {
        try {
          localStorage.setItem("detector-fps", value);
        } catch (e) {
          console.warn("Could not save user preferences:", e);
        }
      }
      updateConfigMutation.mutate({
        frames_per_second: parseInt(value),
        confidence_threshold: parseFloat(confidenceThreshold),
      });
    },
    [confidenceThreshold, updateConfigMutation, isMounted],
  );

  const handleConfidenceThresholdChange = useCallback(
    (value: string) => {
      setConfidenceThreshold(value);
      if (isMounted) {
        try {
          localStorage.setItem("detector-confidence", value);
        } catch (e) {
          console.warn("Could not save user preferences:", e);
        }
      }
      updateConfigMutation.mutate({
        frames_per_second: parseInt(framesPerSecond),
        confidence_threshold: parseFloat(value),
      });
    },
    [framesPerSecond, updateConfigMutation, isMounted],
  );

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setInputType("file");
    }
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setFileUrl(url);
    if (url) {
      setInputType("url");
    }
  }, []);

  const processVideo = useCallback(async () => {
    if (!selectedFile && !fileUrl) {
      toast.error("Please select a video file or provide a URL");
      return;
    }

    // Reset state
    setState({
      isProcessing: true,
      frames: [],
      currentFrame: null,
      progress: 0,
      totalFrames: 0,
      sessionId: null,
      processedVideoUrl: null,
      logoCounts: {},
      downloadProgress: null,
      isVideoCreating: false,
      isVideoProcessing: false,
    });

    abortControllerRef.current = new AbortController();

    try {
      await apiClient.streamVideo(
        selectedFile,
        fileUrl || null,
        parseInt(framesPerSecond),
        parseFloat(confidenceThreshold),
        false, // createVideo - always false, removed from UI
        enableClassification,
        {
          onData: (data: VideoFrameData) => {
            setState((prev) => {
              let newFrames = prev.frames;
              let newProgress = prev.progress;
              let newTotalFrames = prev.totalFrames;
              let newSessionId = prev.sessionId;
              let newProcessedVideoUrl = prev.processedVideoUrl;
              let newLogoCounts = prev.logoCounts;
              let newIsVideoCreating = prev.isVideoCreating;
              let newIsVideoProcessing = prev.isVideoProcessing;
              let newRealtimeCsvFiles = prev.realtimeCsvFiles;

              if (data.type === "status") {
                if (data.estimated_total_frames) {
                  newTotalFrames = data.estimated_total_frames;
                }
                newIsVideoProcessing = true;
              } else if (data.type === "summary") {
                // Handle session summary updates (includes realtime_csv_files)
                if (data.session_id) {
                  newSessionId = data.session_id;
                }
                if (data.logo_totals) {
                  newLogoCounts = data.logo_totals;
                }
                // Update realtime CSV files if available
                if (data.realtime_csv_files) {
                  newRealtimeCsvFiles = data.realtime_csv_files;
                }
              } else if (data.type === "frame" && data.frame_number !== undefined && data.frame_number !== null) {
                // Check if frame already exists, update it; otherwise add it
                const existingIndex = prev.frames.findIndex((f) => f.frame_number === data.frame_number);
                if (existingIndex >= 0) {
                  // Update existing frame
                  newFrames = [...prev.frames];
                  newFrames[existingIndex] = data;
                } else {
                  // Add new frame
                  newFrames = [...prev.frames, data];
                }
                newProgress = data.frame_number;
                if (data.total_frames) {
                  newTotalFrames = data.total_frames;
                }
              } else if (data.type === "complete") {
                newIsVideoCreating = true;
                newIsVideoProcessing = false;
                newTotalFrames = data.total_frames || prev.frames.length;
                if (data.processed_video_url) {
                  newProcessedVideoUrl = data.processed_video_url;
                }
              } else if (data.type === "video_ready") {
                newIsVideoCreating = false;
                newIsVideoProcessing = false;
                newTotalFrames = data.total_frames || prev.frames.length;
                if (data.processed_video_url) {
                  newProcessedVideoUrl = data.processed_video_url;
                }
              } else if (data.frame_number !== undefined && data.frame_number !== null) {
                // Handle other frame types
                const existingIndex = prev.frames.findIndex((f) => f.frame_number === data.frame_number);
                if (existingIndex >= 0) {
                  newFrames = [...prev.frames];
                  newFrames[existingIndex] = data;
                } else {
                  newFrames = [...prev.frames, data];
                }
              }

              // Handle session_summary from frame data (legacy support)
              if (data.session_summary) {
                newSessionId = data.session_summary.session_id;
                newLogoCounts = data.session_summary.logo_totals || {};
                // Update realtime CSV files if available
                if (data.session_summary.realtime_csv_files) {
                  newRealtimeCsvFiles = data.session_summary.realtime_csv_files;
                }
              }

              if (data.processed_video_url) {
                newProcessedVideoUrl = data.processed_video_url;
              }

              return {
                ...prev,
                frames: newFrames,
                currentFrame: data,
                progress: newProgress,
                totalFrames: newTotalFrames,
                sessionId: newSessionId,
                processedVideoUrl: newProcessedVideoUrl,
                logoCounts: newLogoCounts,
                isVideoCreating: newIsVideoCreating,
                isVideoProcessing: newIsVideoProcessing,
                realtimeCsvFiles: newRealtimeCsvFiles,
              };
            });
          },
          onError: (error: string) => {
            toast.error(error);
            setState((prev) => ({ ...prev, isProcessing: false }));
          },
          onComplete: () => {
            setState((prev) => ({ ...prev, isProcessing: false }));
            toast.success("Video processing completed");
          },
          onDownloadProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              downloadProgress: progress,
            }));
          },
          onDownloadComplete: () => {
            toast.success("Video download completed");
          },
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Video processing failed");
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [selectedFile, fileUrl, framesPerSecond, confidenceThreshold, enableClassification]);

  const stopProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({ ...prev, isProcessing: false }));
  }, []);

  const reset = useCallback(() => {
    stopProcessing();
    setSelectedFile(null);
    setFileUrl("");
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      frames: [],
      currentFrame: null,
      progress: 0,
      totalFrames: 0,
      sessionId: null,
      processedVideoUrl: null,
      logoCounts: {},
      downloadProgress: null,
      isVideoCreating: false,
      isVideoProcessing: false,
      realtimeCsvFiles: {},
    }));
  }, [stopProcessing]);

  return {
    inputType,
    setInputType,
    selectedFile,
    fileUrl,
    setFileUrl,
    framesPerSecond,
    setFramesPerSecond,
    confidenceThreshold,
    setConfidenceThreshold,
    enableClassification,
    setEnableClassification,
    state,
    handleFileSelect,
    handleUrlChange,
    processVideo,
    stopProcessing,
    reset,
  };
}
