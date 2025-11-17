"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/detection/file-upload";
import { FilePreviewGrid } from "@/components/detection/file-preview-grid";
import { useImageClassification } from "@/hooks/use-image-classification";
import { useClassificationWeights, useSwitchClassificationWeight } from "@/hooks/use-api";
import { ClassificationResults } from "./_components/classification-results";

export default function ClassificationPage() {
  const {
    selectedFiles,
    topK,
    setTopK,
    results,
    isLoading,
    handleFileSelect,
    removeFile,
    clearFiles,
    classifyAll,
    formatTotalSize,
    getOriginalImage,
  } = useImageClassification();

  const { data: weightsData, isLoading: weightsLoading } = useClassificationWeights();
  const switchWeightMutation = useSwitchClassificationWeight();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Image Classification</h1>
        <p className="text-sm text-muted-foreground">
          Classify images using YOLO classification models
        </p>
      </div>

      {selectedFiles.length === 0 ? (
        <FileUpload onFileSelect={handleFileSelect} accept="image/*" multiple disabled={isLoading} />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📷</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedFiles.length} image{selectedFiles.length > 1 ? "s" : ""} selected
                    </h3>
                    <p className="text-sm text-muted-foreground">Total size: {formatTotalSize()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Model:</span>
                    <Select
                      value={selectedWeight || currentWeight}
                      onValueChange={handleWeightChange}
                      disabled={weightsLoading || availableWeights.length === 0}
                    >
                      <SelectTrigger className="w-48">
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
                          <SelectItem key={weight.name} value={weight.name}>
                            {weight.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Top K:</span>
                    <Select value={topK} onValueChange={setTopK}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={clearFiles}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <span className="text-lg">×</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilePreviewGrid files={selectedFiles} onRemove={removeFile} maxHeight="max-h-60" />

              <div className="flex items-center justify-between pt-4">
                <Button onClick={classifyAll} disabled={isLoading} size="lg" className="px-8">
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Classifying...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">🔍</span>
                      Classify All Images
                    </span>
                  )}
                </Button>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Top K:</span>
                    <Badge variant="secondary">{topK}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <ClassificationResults results={results} getOriginalImage={getOriginalImage} />
          )}
        </div>
      )}
    </div>
  );
}

