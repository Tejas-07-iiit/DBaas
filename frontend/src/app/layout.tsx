// layout.tsx
// The ROOT LAYOUT — every page on the site is wrapped in this.
// Think of it as the "frame": navbar at top, backgrounds behind, children in the middle.

import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ScrollReset from "@/components/effects/ScrollReset";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";

// Load fonts through Next.js (this prevents text flickering on load)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--loaded-heading",   // CSS variable name we can use
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--loaded-mono",
  display: "swap",
});

// Metadata appears in browser tab and search results
export const metadata: Metadata = {
  title: "DBaaS — MongoDB, PostgreSQL & Qdrant in one platform",
  description:
    "Launch and manage MongoDB, PostgreSQL, and Qdrant databases from a single dashboard. One billing, one API, zero ops.",
  keywords: ["database", "MongoDB", "PostgreSQL", "Qdrant", "DBaaS", "managed database"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <ScrollReset />
              <SiteChrome>
                {children}
              </SiteChrome>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
