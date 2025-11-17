/**
 * Hook for image classification functionality
 */

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, type ClassificationResult } from "@/lib/api-client";
import { toast } from "sonner";
import type { FileWithPreview } from "./use-image-detection";

export interface ClassificationResultWithFilename extends ClassificationResult {
  filename: string;
}

export function useImageClassification() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [topK, setTopK] = useState("5");
  const [results, setResults] = useState<ClassificationResultWithFilename[]>([]);

  const classifyMutation = useMutation({
    mutationFn: async ({ files, topK: k }: { files: File[]; topK: number }) => {
      return apiClient.classifyImages(files, k);
    },
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        const resultsWithFilenames: ClassificationResultWithFilename[] =
          response.data.results.map((result, index) => ({
            ...result,
            filename: selectedFiles[index]?.name || `image-${index + 1}`,
          }));
        setResults(resultsWithFilenames);
        toast.success(`Classification completed for ${resultsWithFilenames.length} image(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Classification failed: ${error.message}`);
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

  const classifyAll = useCallback(() => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    const files = selectedFiles.map((f) => f.file);
    classifyMutation.mutate({
      files,
      topK: parseInt(topK),
    });
  }, [selectedFiles, topK, classifyMutation]);

  const formatTotalSize = useCallback(() => {
    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [selectedFiles]);

  const getOriginalImage = useCallback(
    (index: number) => {
      return selectedFiles[index]?.preview || "";
    },
    [selectedFiles]
  );

  return {
    selectedFiles,
    topK,
    setTopK,
    results,
    isLoading: classifyMutation.isPending,
    error: classifyMutation.error,
    handleFileSelect,
    removeFile,
    clearFiles,
    classifyAll,
    formatTotalSize,
    getOriginalImage,
  };
}

