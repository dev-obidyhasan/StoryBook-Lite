import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/module/Auth/Login/LoginForm";
import { BookOpen, Sparkles, Zap, Shield, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Login — StoryBook" };

const FEATURES = [
  {
    icon: Zap,
    title: "3–5 Minute Production",
    desc: "From child photo to print-ready PDF in minutes.",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Art",
    desc: "Character-consistent AI art across every page automatically.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Shield,
    title: "Review & Approve",
    desc: "Full quality control — approve, reject, and regenerate.",
    color: "text-success",
    bg: "bg-success/10 border-success/20",
  },
  {
    icon: Clock,
    title: "100+ Books Per Day",
    desc: "Scale beyond human capacity with automated batches.",
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel — Hero & Marketing ─────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Animated Background Mesh */}
        {/* <div className="absolute inset-0 bg-primary/10 mix-blend-screen" /> */}

        {/* subtle grid pattern over the dark bg */}
        {/* <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(hsl(248 80% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(248 80% 60%) 1px, transparent 1px)", backgroundSize: "64px 64px" }} /> */}

        {/* Top brand logo */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-glow-sm relative">
              <BookOpen className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-xl" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground tracking-tight">StoryBook</span>
              <p className="text-[11px] text-primary uppercase tracking-[0.2em] font-bold mt-0.5">
                Production System
              </p>
            </div>
          </div>
        </div>

        {/* Center hero text */}
        <div className="relative py-16 z-10 space-y-10 animate-slide-up">
          <div className="space-y-6">
            <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Personalized <br />
              <span className="text-primary">
                Storybooks
              </span>
              <br />
              in Minutes.
            </h2>

          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl pt-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 ${f.bg}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white  border border-border ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">{f.title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 animate-fade-in delay-500">
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Storybook AI Production System — Internal Tool
          </p>
        </div>
      </div>

      {/* ── Right panel — Login Form ─────────────────────── */}
      <div className="flex w-full lg:w-[45%] xl:w-[40%] items-center justify-center p-6 sm:p-12 relative bg-secondary">
        {/* Subtle background decoration for the form side */}
        {/* <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" /> */}
        {/* <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-[80px] pointer-events-none" /> */}

        <div className="w-full relative z-10 max-w-[420px]">
          <Suspense
            fallback={
              <div className="w-full space-y-6">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
