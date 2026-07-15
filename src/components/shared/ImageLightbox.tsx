"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LightboxImage {
  url: string;
  label?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  referencePhotoUrl?: string;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  referencePhotoUrl,
}: ImageLightboxProps) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
    },
    [isOpen, hasPrev, hasNext, currentIndex, onClose, onNavigate],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !current) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main container */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {current.label && (
              <span className="text-sm font-semibold text-white">
                {current.label}
              </span>
            )}
            <span className="text-xs text-white/60 tabular-nums">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex flex-1 items-center justify-center gap-4 p-4 overflow-hidden">
          {/* Prev button */}
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={!hasPrev}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Image panels */}
          <div className={cn(
            "flex gap-4 max-h-full",
            referencePhotoUrl ? "items-start" : "items-center",
          )}>
            {/* Main illustration */}
            <div className="flex flex-col items-center gap-2 animate-scale-in">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg max-h-[70vh] max-w-[50vw]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt={current.label ?? "Illustration"}
                  className="max-h-[70vh] max-w-[50vw] w-auto h-auto object-contain"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
              <p className="text-xs text-white/50">Generated Illustration</p>
            </div>

            {/* Reference photo (side-by-side comparison) */}
            {referencePhotoUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-lg max-h-[70vh] max-w-[30vw]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referencePhotoUrl}
                    alt="Child reference photo"
                    className="max-h-[70vh] max-w-[30vw] w-auto h-auto object-contain"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 backdrop-blur-sm px-2 py-0.5">
                    <User className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[10px] font-semibold text-primary">Reference</span>
                  </div>
                </div>
                <p className="text-xs text-white/50">Child Reference Photo</p>
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={!hasNext}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-white/10 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={cn(
                  "relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  idx === currentIndex
                    ? "border-primary scale-110"
                    : "border-white/10 opacity-50 hover:opacity-80",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-white/30 pointer-events-none">
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono">←</kbd>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono">→</kbd>
          <span>navigate</span>
          <span className="mx-1">·</span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono">Esc</kbd>
          <span>close</span>
        </div>
      </div>
    </div>
  );
}
