"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/5 border border-destructive/10 mb-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>
      <Button onClick={reset} size="lg">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}
