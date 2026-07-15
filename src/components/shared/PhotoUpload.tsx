"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, User, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_MB = 10;

export function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
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
      <div className="relative group rounded-xl overflow-hidden border border-success/30 bg-success/5 aspect-[4/3] max-h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Child photo preview"
          className="w-full h-full object-cover"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20"
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Change Photo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </Button>
        </div>
        {/* Success badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full border border-success/30 bg-success/20 backdrop-blur-sm px-2 py-1">
          <CheckCircle2 className="w-3 h-3 text-success" />
          <span className="text-[10px] font-semibold text-success">Photo set</span>
        </div>
        {/* Filename badge */}
        <div className="absolute bottom-2 left-2 max-w-[70%]">
          <span className="inline-block text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-2 py-0.5 truncate max-w-full">
            {value.name}
          </span>
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
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload child photo — drop or click"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/8 scale-[1.01]"
            : error
              ? "border-destructive/50 bg-destructive/5 hover:border-destructive/70"
              : "border-border hover:border-primary/40 hover:bg-primary/4",
        )}
      >
        {/* Animated background on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 pointer-events-none" />
        )}

        {/* Icon area */}
        <div
          className={cn(
            "relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
            isDragging
              ? "bg-primary/20 shadow-glow-sm scale-110"
              : "bg-muted/60",
          )}
        >
          {isDragging ? (
            <UploadCloud className="w-7 h-7 text-primary" />
          ) : (
            <>
              <User className="w-7 h-7 text-muted-foreground/60" />
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary/80 ">
                <UploadCloud className="w-3 h-3 text-white" />
              </span>
            </>
          )}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isDragging ? "Drop photo here" : "Upload Child Photo"}
          </p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click — JPEG / PNG, min 512×512px, max {MAX_SIZE_MB}MB
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
