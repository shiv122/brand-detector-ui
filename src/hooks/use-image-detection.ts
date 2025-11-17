/**
 * Hook for image detection functionality
 */

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, type DetectionResult } from "@/lib/api-client";
import { useConfig, useUpdateConfig } from "./use-api";
import { toast } from "sonner";

export interface FileWithPreview {
  file: File;
  name: string;
  size: number;
  preview: string;
}

export interface DetectionResultWithFilename extends DetectionResult {
  filename: string;
}

export function useImageDetection() {
  const { data: configData } = useConfig();
  const updateConfigMutation = useUpdateConfig();

  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState("0.5");
  const [results, setResults] = useState<DetectionResultWithFilename[]>([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const detectMutation = useMutation({
    mutationFn: async ({ files, confidenceThreshold: threshold }: { files: File[]; confidenceThreshold: number }) => {
      return apiClient.detectMultipleImages(files, threshold);
    },
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        const resultsWithFilenames: DetectionResultWithFilename[] = response.data.results.map((result, index) => ({
          ...result,
          filename: selectedFiles[index]?.name || `image-${index + 1}`,
        }));
        setResults(resultsWithFilenames);
        toast.success(`Detection completed for ${resultsWithFilenames.length} image(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Detection failed: ${error.message}`);
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles((prev) => {
      prev.forEach((file) => URL.revokeObjectURL(file.preview));
      return [];
    });
    setResults([]);
  }, []);

  const detectAll = useCallback(() => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    const files = selectedFiles.map((f) => f.file);
    detectMutation.mutate({
      files,
      confidenceThreshold: parseFloat(confidenceThreshold),
    });
  }, [selectedFiles, confidenceThreshold, detectMutation]);

  const formatTotalSize = useCallback(() => {
    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [selectedFiles]);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load config from API on mount
  useEffect(() => {
    if (configData?.data && !isConfigLoaded && isMounted) {
      const config = configData.data;
      setConfidenceThreshold(config.confidence_threshold.toString());
      setIsConfigLoaded(true);
    }
  }, [configData, isConfigLoaded, isMounted]);

  // Load user preferences from localStorage (client-side only, after config is loaded)
  useEffect(() => {
    if (isMounted && !isConfigLoaded && !configData?.data) {
      try {
        const savedConfidence = localStorage.getItem("detector-confidence");
        if (savedConfidence) setConfidenceThreshold(savedConfidence);
      } catch (e) {
        console.warn("Could not load user preferences:", e);
      }
    }
  }, [isConfigLoaded, configData, isMounted]);

  // Update config when confidence threshold changes
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
        frames_per_second: 5, // Default for image detection
        confidence_threshold: parseFloat(value),
      });
    },
    [updateConfigMutation, isMounted],
  );

  return {
    selectedFiles,
    confidenceThreshold,
    setConfidenceThreshold: handleConfidenceThresholdChange,
    results,
    isLoading: detectMutation.isPending,
    error: detectMutation.error,
    handleFileSelect,
    removeFile,
    clearFiles,
    detectAll,
    formatTotalSize,
    totalDetections: results.reduce((sum, r) => sum + r.total_detections, 0),
  };
}
