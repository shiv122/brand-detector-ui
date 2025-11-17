"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/config/app-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";
import type { DetectionResultWithFilename } from "@/hooks/use-image-detection";

interface DetectionResultsProps {
  results: DetectionResultWithFilename[];
  totalDetections: number;
}

export function DetectionResults({ results, totalDetections }: DetectionResultsProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
  const [hoveredDetection, setHoveredDetection] = useState<{
    resultIndex: number;
    detectionIndex: number;
  } | null>(null);
  const imageRefs = useRef<Map<number, HTMLImageElement>>(new Map());

  const calculateBboxPosition = (
    bbox: [number, number, number, number],
    imgElement: HTMLImageElement | null
  ) => {
    if (!imgElement) return null;

    const imgRect = imgElement.getBoundingClientRect();
    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;
    const displayedWidth = imgRect.width;
    const displayedHeight = imgRect.height;

    // Calculate scale factors
    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY); // object-contain uses min scale

    // Calculate actual displayed dimensions
    const actualWidth = naturalWidth * scale;
    const actualHeight = naturalHeight * scale;

    // Calculate offsets (centering)
    const offsetX = (displayedWidth - actualWidth) / 2;
    const offsetY = (displayedHeight - actualHeight) / 2;

    // Scale bbox coordinates
    const [x1, y1, x2, y2] = bbox;
    const left = offsetX + x1 * scale;
    const top = offsetY + y1 * scale;
    const width = (x2 - x1) * scale;
    const height = (y2 - y1) * scale;

    return { left, top, width, height };
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Detection Results</h4>
          <Badge variant="outline" className="text-xs">
            {results.length} {results.length === 1 ? "image" : "images"} • {totalDetections} detections
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result, index) => {
            const imgRef = imageRefs.current.get(index);
            const hoveredBbox =
              hoveredDetection?.resultIndex === index
                ? calculateBboxPosition(
                    result.detections[hoveredDetection.detectionIndex]?.bbox as [number, number, number, number],
                    imgRef || null
                  )
                : null;

            return (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
              >
                {/* Image Section */}
                <div className="relative bg-muted/50">
                  {result.annotated_image ? (
                    <div className="relative w-full h-64">
                      <img
                        ref={(el) => {
                          if (el) imageRefs.current.set(index, el);
                        }}
                        src={result.annotated_image}
                        alt={`Annotated ${result.filename}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() =>
                          setPreviewImage({
                            url: result.annotated_image!,
                            filename: result.filename,
                          })
                        }
                      />
                      {/* Bounding box overlay */}
                      {hoveredBbox && (
                        <div
                          className="absolute border-2 border-primary bg-primary/20 pointer-events-none transition-all animate-pulse"
                          style={{
                            left: `${hoveredBbox.left}px`,
                            top: `${hoveredBbox.top}px`,
                            width: `${hoveredBbox.width}px`,
                            height: `${hoveredBbox.height}px`,
                            boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3)",
                            animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">No image available</div>
                    </div>
                  )}
                  {result.total_detections > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs font-semibold">
                        {result.total_detections} {result.total_detections === 1 ? "logo" : "logos"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate mb-1">
                        {result.filename}
                      </h5>
                    </div>
                    {result.error ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>

                  {result.error ? (
                    <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
                      {result.error}
                    </div>
                  ) : (
                    result.detections.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Detected Brands ({result.detections.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                          {result.detections.map((detection, detIndex) => (
                            <div
                              key={detIndex}
                              className="border rounded-md p-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onMouseEnter={() =>
                                setHoveredDetection({ resultIndex: index, detectionIndex: detIndex })
                              }
                              onMouseLeave={() => setHoveredDetection(null)}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-medium truncate">
                                  {detection.class_name}
                                </span>
                                {APP_CONFIG.showConfidence && (
                                  <Badge
                                    variant={detection.confidence > 0.8 ? "default" : "secondary"}
                                    className="text-[10px] px-1.5 py-0 shrink-0"
                                  >
                                    {Math.round(detection.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                [{detection.bbox.map((b) => Math.round(b)).join(", ")}]
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
          <DialogHeader>
            <DialogTitle>{previewImage?.filename}</DialogTitle>
            <DialogDescription>Full size annotated image preview</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4 overflow-auto max-h-[85vh]">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
