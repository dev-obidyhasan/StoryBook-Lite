import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Storybook Production — Admin",
    template: "%s | Storybook Admin",
  },
  description:
    "AI-Powered Personalized Story Book Production System — Admin Panel",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
              boxShadow: "var(--tw-shadow)",
            },
            className: "shadow-dropdown rounded-xl",
          }}
        />
      </body>
    </html>
  );
}
