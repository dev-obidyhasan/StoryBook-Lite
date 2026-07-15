import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT:    "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
          muted:                "hsl(var(--sidebar-muted))",
        },
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        card:         "0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 12px 32px -6px hsl(var(--primary) / 0.18), 0 4px 12px -2px rgb(0 0 0 / 0.08)",
        dropdown:     "0 12px 32px -6px rgb(0 0 0 / 0.14), 0 4px 12px -2px rgb(0 0 0 / 0.08)",
        sidebar:      "4px 0 24px 0 rgb(0 0 0 / 0.05)",
        "glow-sm":    "0 0 12px hsl(var(--primary) / 0.3)",
        "glow-md":    "0 0 24px hsl(var(--primary) / 0.35), 0 0 48px hsl(var(--primary) / 0.15)",
        "inner-sm":   "inset 0 1px 2px 0 rgb(0 0 0 / 0.06)",
      },
      backgroundImage: {
        "gradient-primary":  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
        "gradient-primary-r":"linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))",
        "gradient-success":  "linear-gradient(135deg, hsl(151,69%,38%), hsl(160,60%,45%))",
        "gradient-warm":     "linear-gradient(135deg, hsl(36,95%,52%), hsl(4,88%,60%))",
        "gradient-surface":  "linear-gradient(180deg, hsl(0,0%,100%) 0%, hsl(240,5%,96%) 100%)",
        "gradient-dark":     "linear-gradient(135deg, hsl(233,45%,8%), hsl(240,40%,12%))",
        "gradient-card":     "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.04))",
        "mesh-primary":      "radial-gradient(ellipse 60% 50% at 20% 10%, hsl(var(--primary) / 0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(248 80% 60% / 0.4)" },
          "50%":      { boxShadow: "0 0 24px hsl(248 80% 60% / 0.7), 0 0 48px hsl(248 80% 60% / 0.3)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "shimmer-slide": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.3s ease-out both",
        "fade-up":         "fade-up 0.4s ease-out both",
        "scale-in":        "scale-in 0.3s ease-out both",
        "slide-up":        "slide-up 0.5s ease-out both",
        "slide-in-right":  "slide-in-right 0.3s ease-out both",
        float:             "float 3s ease-in-out infinite",
        "pulse-glow":      "pulse-glow 2s ease-in-out infinite",
        shimmer:           "shimmer-slide 1.8s ease-in-out infinite",
        "spin-slow":       "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;