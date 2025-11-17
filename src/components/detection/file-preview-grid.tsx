"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FileWithPreview } from "@/hooks/use-image-detection";

interface FilePreviewGridProps {
  files: FileWithPreview[];
  onRemove: (index: number) => void;
  maxHeight?: string;
}

export function FilePreviewGrid({ files, onRemove, maxHeight = "max-h-32" }: FilePreviewGridProps) {
  if (files.length === 0) return null;

  return (
    <div className={`grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 overflow-y-auto ${maxHeight}`}>
      {files.map((file, index) => (
        <div key={index} className="relative group">
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-16 object-cover rounded border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
            <Button
              onClick={() => onRemove(index)}
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

