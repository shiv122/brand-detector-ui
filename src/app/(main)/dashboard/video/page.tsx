"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useVideoDetection } from "@/hooks/use-video-detection";
import { useWeights, useSwitchWeight, useClassificationWeights, useSwitchClassificationWeight } from "@/hooks/use-api";
import { VideoResults } from "./_components/video-results";
import { Play, Square, RefreshCw, Settings, Video, Upload, Link as LinkIcon, Cpu, Gauge, Target, X } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VideoDetectionPage() {
  const {
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
  } = useVideoDetection();

  const { data: weightsData, isLoading: weightsLoading } = useWeights();
  const switchWeightMutation = useSwitchWeight();
  const [selectedWeight, setSelectedWeight] = useState("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { data: classificationWeightsData, isLoading: classificationWeightsLoading } = useClassificationWeights();
  const switchClassificationWeightMutation = useSwitchClassificationWeight();
  const [selectedClassificationWeight, setSelectedClassificationWeight] = useState("");

  const availableWeights = weightsData?.data?.available_weights || [];
  const currentWeight = weightsData?.data?.current_weight || "";

  const availableClassificationWeights = classificationWeightsData?.data?.available_weights || [];
  const currentClassificationWeight = classificationWeightsData?.data?.current_weight || "";

  useEffect(() => {
    if (currentWeight && !selectedWeight) {
      setSelectedWeight(currentWeight);
    }
  }, [currentWeight, selectedWeight]);

  useEffect(() => {
    if (currentClassificationWeight && !selectedClassificationWeight) {
      setSelectedClassificationWeight(currentClassificationWeight);
    }
  }, [currentClassificationWeight, selectedClassificationWeight]);

  const handleWeightChange = (weightName: string) => {
    setSelectedWeight(weightName);
    switchWeightMutation.mutate(weightName);
  };

  const handleClassificationWeightChange = (weightName: string) => {
    setSelectedClassificationWeight(weightName);
    switchClassificationWeightMutation.mutate(weightName);
  };

  const progressPercentage =
    state.totalFrames > 0 ? (state.progress / state.totalFrames) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Video Detection</h1>
        <p className="text-sm text-muted-foreground">
          Upload a video file or provide a URL to detect logos in real-time
        </p>
      </div>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Current detection settings</CardDescription>
            </div>
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detection Configuration</DialogTitle>
                  <DialogDescription>
                    Adjust detection settings and processing parameters
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model-select" className="text-sm font-medium">
                      AI Model
                    </Label>
                    <Select
                      value={selectedWeight || currentWeight}
                      onValueChange={handleWeightChange}
                      disabled={weightsLoading || availableWeights.length === 0}
                    >
                      <SelectTrigger id="model-select" className="w-full">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <SelectValue
                            placeholder={
                              weightsLoading
                                ? "Loading models..."
                                : availableWeights.length === 0
                                  ? "No models available"
                                  : "Select a model"
                            }
                          />
                        </div>
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

                  {/* Processing Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fps-select" className="text-sm font-medium">
                        Frame Rate
                      </Label>
                      <Select value={framesPerSecond} onValueChange={setFramesPerSecond}>
                        <SelectTrigger id="fps-select" className="w-full">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 FPS</SelectItem>
                          <SelectItem value="2">2 FPS</SelectItem>
                          <SelectItem value="5">5 FPS</SelectItem>
                          <SelectItem value="10">10 FPS</SelectItem>
                          <SelectItem value="15">15 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confidence-select" className="text-sm font-medium">
                        Confidence Threshold
                      </Label>
                      <Select value={confidenceThreshold} onValueChange={setConfidenceThreshold}>
                        <SelectTrigger id="confidence-select" className="w-full">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.1">10%</SelectItem>
                          <SelectItem value="0.3">30%</SelectItem>
                          <SelectItem value="0.4">40%</SelectItem>
                          <SelectItem value="0.5">50%</SelectItem>
                          <SelectItem value="0.7">70%</SelectItem>
                          <SelectItem value="0.9">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Classification Toggle */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Enable Classification</Label>
                        <p className="text-xs text-muted-foreground">
                          Use classification model to categorize detected logos
                        </p>
                      </div>
                      <Switch checked={enableClassification} onCheckedChange={setEnableClassification} />
                    </div>

                    {/* Classification Model Selection - Only show when enabled */}
                    {enableClassification && (
                      <div className="space-y-2">
                        <Label htmlFor="classification-model-select" className="text-sm font-medium">
                          Classification Model
                        </Label>
                        <Select
                          value={selectedClassificationWeight || currentClassificationWeight}
                          onValueChange={handleClassificationWeightChange}
                          disabled={classificationWeightsLoading || availableClassificationWeights.length === 0}
                        >
                          <SelectTrigger id="classification-model-select" className="w-full">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-muted-foreground" />
                              <SelectValue
                                placeholder={
                                  classificationWeightsLoading
                                    ? "Loading models..."
                                    : availableClassificationWeights.length === 0
                                      ? "No classification models available"
                                      : "Select a classification model"
                                }
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {availableClassificationWeights.map((weight) => (
                              <SelectItem key={weight.name} value={weight.name}>
                                {weight.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-md bg-primary/10">
                <Cpu className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="text-sm font-medium truncate">
                  {selectedWeight || currentWeight || "Not selected"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-md bg-primary/10">
                <Gauge className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Frame Rate</p>
                <p className="text-sm font-medium">{framesPerSecond} FPS</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-md bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-medium">
                  {APP_CONFIG.showConfidence
                    ? `${Math.round(parseFloat(confidenceThreshold) * 100)}%`
                    : "Configured"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-md bg-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Classification</p>
                <p className="text-sm font-medium truncate">
                  {enableClassification 
                    ? (selectedClassificationWeight || currentClassificationWeight || "Not selected")
                    : "Disabled"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Video Source</CardTitle>
              <CardDescription className="mt-1">
                Upload a video file or provide a URL to detect logos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputType} onValueChange={(value) => setInputType(value as "file" | "url")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20 hover:bg-muted/30"
                  onClick={() => {
                    if (!state.isProcessing) {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "video/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleFileSelect(file);
                        }
                      };
                      input.click();
                    }
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Click to upload video</h3>
                      <p className="text-muted-foreground text-sm">
                        Drag and drop a video file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports MP4, AVI, MOV, MKV, and other video formats
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="px-8"
                      disabled={state.isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleFileSelect(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Video File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={reset}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="video-url"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={fileUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={state.isProcessing}
                    className="flex-1"
                  />
                  {fileUrl && (
                    <Button
                      onClick={() => {
                        handleUrlChange("");
                      }}
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a direct link to a video file (MP4, AVI, MOV, etc.)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 pt-2 border-t">
            {!state.isProcessing ? (
              <Button
                onClick={processVideo}
                disabled={!selectedFile && !fileUrl}
                className="flex items-center gap-2"
                size="lg"
              >
                <Play className="h-4 w-4" />
                Start Processing
              </Button>
            ) : (
              <Button onClick={stopProcessing} variant="destructive" className="flex items-center gap-2" size="lg">
                <Square className="h-4 w-4" />
                Stop Processing
              </Button>
            )}
            {(selectedFile || fileUrl) && !state.isProcessing && (
              <Button onClick={reset} variant="outline" className="flex items-center gap-2" size="lg">
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {state.isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>
                  {state.progress} / {state.totalFrames || "?"} frames
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>
          )}

          {state.downloadProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Downloading video...</span>
                <span>{state.downloadProgress.percentage}%</span>
              </div>
              <Progress value={state.downloadProgress.percentage} />
            </div>
          )}
        </CardContent>
      </Card>

      {state.frames.length > 0 && (
        <VideoResults
          frames={state.frames}
          logoCounts={state.logoCounts}
          processedVideoUrl={state.processedVideoUrl}
          sessionId={state.sessionId}
          framesPerSecond={parseInt(framesPerSecond)}
          isProcessing={state.isProcessing}
          progressPercentage={
            state.totalFrames > 0
              ? (state.progress / state.totalFrames) * 100
              : state.frames.length > 0
                ? Math.min(state.frames.length * 5, 95)
                : 0
          }
          isVideoCreating={state.isVideoCreating}
          isVideoProcessing={state.isVideoProcessing}
          realtimeCsvFiles={state.realtimeCsvFiles}
        />
      )}
    </div>
  );
}

