"use client";

import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  multiple = true,
  disabled = false,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={!disabled ? handleClick : undefined}
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <Upload className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-1">Drop files here</h3>
          <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-6"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Choose Files
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

