"use client";

import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/services/auth/login";
import { useState } from "react";
import {
  BookOpen,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Shield,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/orders";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await loginUser(data);
      if (result.success) {
        toast.success("Welcome back! Redirecting…");
        await new Promise((r) => setTimeout(r, 400));
        window.location.href = callbackUrl;
      } else {
        toast.error(result.message || "Invalid credentials. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("w-full animate-fade-in", className)} {...props}>
      {/* ── Brand Mark (Mobile Only) ────────────────────────── */}
      <div className="flex lg:hidden flex-col items-center gap-5 mb-10">
        <div className="relative">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-glow-sm">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

        </div>
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-Black">
            StoryBook
          </h1>
          <p className="text-xs text-primary uppercase tracking-[0.2em] font-bold">
            Production System
          </p>
        </div>
      </div>

      {/* ── Login Card ──────────────────────────────────────── */}
      <div className="surface-card p-8 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Subtle top accent line */}
        {/* <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-primary" /> */}

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Sign In
          </h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Enter your admin credentials to access the production control center.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-foreground"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
              <Input
                id="email"
                type="email"
                placeholder="admin@storybook.com"
                autoComplete="email"
                className="h-12 pl-11 bg-muted/30 border-border focus-visible:bg-white transition-colors"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              className="text-sm font-bold text-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12 pl-11 pr-11 bg-muted/30 border-border focus-visible:bg-white transition-colors"
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-sm font-bold mt-4 shadow-glow-sm transition-all hover:shadow-glow-md"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Authenticating…
              </>
            ) : (
              <>
                Sign In to Platform
                <Zap className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Footer note */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <p className="text-xs text-primary/80 font-semibold leading-relaxed">
            Secure internal platform. JWT secured, role-based access required.
          </p>
        </div>
      </div>
    </div>
  );
}
