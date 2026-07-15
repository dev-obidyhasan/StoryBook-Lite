import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted border border-border  mb-6">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-2 gradient-text">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">
        Page not found
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        The page you are looking for does not exist, has been moved, or you don&apos;t have access to it.
      </p>
      <Button asChild size="lg">
        <Link href="/templates">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
