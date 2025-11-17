"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { APP_CONFIG } from "@/config/app-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ClassificationResultWithFilename } from "@/hooks/use-image-classification";

interface ClassificationResultsProps {
  results: ClassificationResultWithFilename[];
  getOriginalImage: (index: number) => string;
}

export function ClassificationResults({
  results,
  getOriginalImage,
}: ClassificationResultsProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Classification Results</h4>
          <Badge variant="outline" className="text-xs">
            {results.length} {results.length === 1 ? "image" : "images"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              <div className="p-4 space-y-3">
                {/* Header with thumbnail */}
                <div className="flex items-start gap-3">
                  <div
                    className="relative shrink-0 cursor-pointer group"
                    onClick={() =>
                      setPreviewImage({
                        url: getOriginalImage(index),
                        filename: result.filename,
                      })
                    }
                  >
                    <div className="w-20 h-20 rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                      <img
                        src={getOriginalImage(index)}
                        alt={result.filename}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    {result.top_prediction && APP_CONFIG.showConfidence && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="default" className="text-[10px] px-1 py-0 font-semibold">
                          {Math.round(result.top_prediction.confidence * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">
                          {result.filename}
                        </h5>
                        {result.top_prediction && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="default" className="text-xs font-semibold">
                              {result.top_prediction.class_name}
                            </Badge>
                            {APP_CONFIG.showConfidence && (
                              <span className="text-xs font-medium text-muted-foreground">
                                {Math.round(result.top_prediction.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {result.error ? (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {result.error ? (
                  <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
                    {result.error}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Predictions
                    </div>
                    <div className="space-y-1.5">
                      {result.classifications.map((classification, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium truncate">
                              {classification.class_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={classification.confidence * 100}
                              className="h-1 flex-1"
                            />
                            {APP_CONFIG.showConfidence && (
                              <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">
                                {Math.round(classification.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewImage?.filename}</DialogTitle>
            <DialogDescription>Full size image preview</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4 overflow-auto">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
