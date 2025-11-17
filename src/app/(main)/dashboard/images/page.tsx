"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/detection/file-upload";
import { FilePreviewGrid } from "@/components/detection/file-preview-grid";
import { useImageDetection } from "@/hooks/use-image-detection";
import { useWeights, useSwitchWeight } from "@/hooks/use-api";
import { DetectionResults } from "./_components/detection-results";
import { APP_CONFIG } from "@/config/app-config";

export default function ImageDetectionPage() {
  const {
    selectedFiles,
    confidenceThreshold,
    setConfidenceThreshold,
    results,
    isLoading,
    handleFileSelect,
    removeFile,
    clearFiles,
    detectAll,
    formatTotalSize,
    totalDetections,
  } = useImageDetection();

  const { data: weightsData, isLoading: weightsLoading } = useWeights();
  const switchWeightMutation = useSwitchWeight();
  const [selectedWeight, setSelectedWeight] = useState("");

  const availableWeights = weightsData?.data?.available_weights || [];
  const currentWeight = weightsData?.data?.current_weight || "";

  useEffect(() => {
    if (currentWeight && !selectedWeight) {
      setSelectedWeight(currentWeight);
    }
  }, [currentWeight, selectedWeight]);

  const handleWeightChange = (weightName: string) => {
    setSelectedWeight(weightName);
    switchWeightMutation.mutate(weightName);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Image Detection</h1>
        <p className="text-sm text-muted-foreground">Upload images to detect logos</p>
      </div>

      {selectedFiles.length === 0 ? (
        <FileUpload onFileSelect={handleFileSelect} accept="image/*" multiple disabled={isLoading} />
      ) : (
        <div className="space-y-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {selectedFiles.length} image{selectedFiles.length > 1 ? "s" : ""}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatTotalSize()}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={selectedWeight || currentWeight}
                onValueChange={handleWeightChange}
                disabled={weightsLoading || availableWeights.length === 0}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue
                    placeholder={
                      weightsLoading
                        ? "Loading..."
                        : availableWeights.length === 0
                          ? "No models"
                          : "Select model"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableWeights.map((weight) => (
                    <SelectItem key={weight.name} value={weight.name} className="text-xs">
                      {weight.name}
                    </SelectItem>
                  ))}
                  {!weightsLoading && availableWeights.length === 0 && (
                    <SelectItem value="" disabled className="text-xs">
                      No models available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={confidenceThreshold} onValueChange={setConfidenceThreshold}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1" className="text-xs">
                    10%
                  </SelectItem>
                  <SelectItem value="0.3" className="text-xs">
                    30%
                  </SelectItem>
                  <SelectItem value="0.5" className="text-xs">
                    50%
                  </SelectItem>
                  <SelectItem value="0.7" className="text-xs">
                    70%
                  </SelectItem>
                  <SelectItem value="0.9" className="text-xs">
                    90%
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={clearFiles}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Compact Image Previews */}
          <FilePreviewGrid files={selectedFiles} onRemove={removeFile} />

          {/* Compact Action Button */}
          <div className="flex items-center justify-between">
            <Button onClick={detectAll} disabled={isLoading} size="sm" className="px-6">
              {isLoading ? (
                <span className="flex items-center text-xs">
                  <span className="animate-spin mr-2">⏳</span>
                  Detecting...
                </span>
              ) : (
                <span className="flex items-center text-xs">
                  <span className="mr-2">🔍</span>
                  Detect Logos
                </span>
              )}
            </Button>
            {APP_CONFIG.showConfidence && (
              <Badge variant="secondary" className="text-xs">
                Confidence: {Math.round(parseFloat(confidenceThreshold) * 100)}%
              </Badge>
            )}
          </div>

          {results.length > 0 && (
            <DetectionResults results={results} totalDetections={totalDetections} />
          )}
        </div>
      )}
    </div>
  );
}

