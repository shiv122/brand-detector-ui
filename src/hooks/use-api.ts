/**
 * React Query hooks for API calls
 * Provides typed hooks with proper error handling and caching
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type ConfigData, type WeightInfo, type WeightsResponse } from "@/lib/api-client";
import { toast } from "sonner";

// Health Check
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Config
export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => apiClient.getConfig(),
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ConfigData) => apiClient.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Configuration updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update config: ${error.message}`);
    },
  });
}

// Weights
export function useWeights() {
  return useQuery({
    queryKey: ["weights"],
    queryFn: () => apiClient.getWeights(),
  });
}

export function useSwitchWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weightName: string) => apiClient.switchWeight(weightName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weights"] });
      toast.success("Model switched successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to switch model: ${error.message}`);
    },
  });
}

// Classification Weights
export function useClassificationWeights() {
  return useQuery({
    queryKey: ["classification-weights"],
    queryFn: () => apiClient.getClassificationWeights(),
  });
}

export function useSwitchClassificationWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weightName: string) => apiClient.switchClassificationWeight(weightName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-weights"] });
      toast.success("Classification model switched successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to switch classification model: ${error.message}`);
    },
  });
}

// CSV Files
export function useAvailableCSVFiles() {
  return useQuery({
    queryKey: ["csv-files"],
    queryFn: () => apiClient.getAvailableCSVFiles(),
  });
}

export function useCleanupCSVFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (maxFiles: number) => apiClient.cleanupOldCSVFiles(maxFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csv-files"] });
      toast.success("CSV files cleaned up");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cleanup CSV files: ${error.message}`);
    },
  });
}

