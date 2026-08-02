"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { UploadCloud, X, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageImageUploadProps {
  pageNumber: number;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_MB = 20;

export function PageImageUpload({ pageNumber, value, onChange, error }: PageImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) return;

      onChange(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ── Preview state ───────────────────────────────────── */
  if (value && previewUrl) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-success/30 bg-success/5 aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={`Page ${pageNumber} preview`}
          className="w-full h-full object-cover"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="border-white/30 text-white hover:bg-white/20"
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            Change
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Remove
          </Button>
        </div>

        {/* Page Badge */}
        <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm text-white font-bold text-xs">
          {pageNumber}
        </div>

        {/* Success badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full border border-success/30 bg-success/20 backdrop-blur-sm px-2 py-1">
          <CheckCircle2 className="w-3 h-3 text-success" />
          <span className="text-[10px] font-semibold text-success">Uploaded</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
    );
  }

  /* ── Drop zone ───────────────────────────────────────── */
  return (
    <div className="space-y-2 h-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative w-full h-full flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 aspect-[4/3]",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.03] shadow-lg shadow-primary/20 ring-4 ring-primary/20"
            : error
              ? "border-destructive/50 bg-destructive/5 hover:border-destructive/70"
              : "border-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-md",
        )}
      >
        {/* Page Badge */}
        <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground font-bold text-xs">
          {pageNumber}
        </div>

        {isDragging && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
        )}

        <div
          className={cn(
            "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
            isDragging ? "bg-primary text-primary-foreground shadow-glow-md scale-125" : "bg-muted/60 text-muted-foreground/60",
          )}
        >
          {isDragging ? (
            <UploadCloud className="w-6 h-6 text-primary" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isDragging ? "Drop image here" : `Upload Page ${pageNumber}`}
          </p>
          <p className="text-xs text-muted-foreground px-4">
            Drag & drop or click
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
