/**
 * @file src/components/layout/SiteChrome.tsx
 * @description Master visual frame wrapper for public and marketing pages.
 * 
 * Rules:
 * - If route is under `/dashboard`, site chrome (Navbar/Footer/Background effects) is bypassed
 *   because Dashboard uses its own dedicated sidebar and header layout.
 * - If route is an auth page (/login, /signup, etc.), Navbar and backgrounds are shown, but Footer is hidden.
 * - Otherwise (marketing, docs, blog, legal), full Navbar, GridBackground, CursorGlow, and Footer are active.
 */

"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GridBackground from "@/components/effects/GridBackground";
import CursorGlow from "@/components/effects/CursorGlow";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAuth = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <GridBackground />
      <CursorGlow />
      <Navbar />
      <main id="main-content" style={{ position: "relative", zIndex: 2 }}>
        {children}
      </main>
      {!isAuth && <Footer />}
    </>
  );
}
