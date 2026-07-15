"use client";

import { cn } from "@/lib/utils";
import { Skeleton as ShadSkeleton } from "@/components/ui/skeleton";

// Re-export Skeleton so consumers can import it from this module too
export { ShadSkeleton as Skeleton };

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <ShadSkeleton className={cn("animate-pulse", className)} />
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <LoadingSkeleton className="h-14 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function IllustrationGridSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      <LoadingSkeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <LoadingSkeleton className="aspect-square rounded-xl" />
            <LoadingSkeleton className="h-4 w-2/3 rounded" />
            <LoadingSkeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl animate-fade-up">
      <LoadingSkeleton className="h-10 w-64 rounded" />
      <LoadingSkeleton className="h-52 rounded-xl" />
      <LoadingSkeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function TemplateGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
      {Array.from({ length: 6 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-56 rounded-xl" />
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-32 rounded" />
        <LoadingSkeleton className="h-8 w-64 rounded" />
        <LoadingSkeleton className="h-3 w-96 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <LoadingSkeleton className="h-48 rounded-xl border" />
          <LoadingSkeleton className="h-32 rounded-xl border" />
          <LoadingSkeleton className="h-40 rounded-xl border" />
        </div>
        <div className="space-y-8">
          <LoadingSkeleton className="h-40 rounded-xl border" />
          <LoadingSkeleton className="h-32 rounded-xl border" />
        </div>
      </div>
    </div>
  );
}