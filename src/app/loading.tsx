"use client";
import logo from "@/assets/logo/logo.png";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Gradients */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-emerald-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Container with Glow */}
          <div className="relative mb-8">
            {/* Ambient Glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
            />

            {/* Logo Animation */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [0.95, 1, 0.95],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="relative flex aspect-square size-16 items-center justify-center rounded-full bg-primary shadow-glow-sm shrink-0 overflow-hidden">
                <BookOpen className="size-10 text-white relative z-10" />
                <div className="absolute inset-0 bg-white/10" />
              </div>
            </motion.div>
          </div>

          {/* Loading Indicator */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-1 w-32 bg-secondary/30 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1"
            >
              Loading...
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
