"use client";
// Navbar.tsx — Main navigation bar

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Headphones, ArrowRight } from "lucide-react";
import Logo from "./Logo";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import { mainNavLinks } from "@/data/navigation";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/lib/auth/AuthProvider";

const UNDERLINE_ID = "nav-underline";

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [activeMenu, setActiveMenu] = useState<"product" | "resources" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered]       = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [mag, setMag] = useState({ x: 0, y: 0 });
  const pathname = usePathname();
  const { status, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setActiveMenu(null);
  }, [pathname]);

  // Handle scroll to close and add background
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (Math.abs(window.scrollY - lastScrollY) > 10) {
        setActiveMenu(null);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = (menu: "product" | "resources") => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150); // Increased to 150ms as requested
  };

  const handleTap = (menu: "product" | "resources", e: React.MouseEvent) => {
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      setActiveMenu((prev) => (prev === menu ? null : menu));
    }
  };

  const handleMagMove = useCallback((e: React.MouseEvent) => {
    const rect = ctaRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMag({
      x: (e.clientX - rect.left - rect.width / 2) * 0.25,
      y: (e.clientY - rect.top - rect.height / 2) * 0.25,
    });
  }, []);

  const navStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    height: "var(--nav-h)",
    display: "flex",
    alignItems: "center",
    background: scrolled ? "rgba(5,8,15,0.92)" : "rgba(5,8,15,0.7)",
    backdropFilter: "blur(18px)",
    borderBottom: scrolled ? "1px solid var(--border-bright)" : "1px solid var(--border)",
    transition: "background 0.3s, border-color 0.3s",
  };

  return (
    <>
      <header ref={navRef} role="banner" style={navStyle} onMouseLeave={handleMouseLeave}>
        <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", gap: "1.5rem", position: "relative" }}>

          {/* LEFT SIDE */}
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Logo />
            <nav aria-label="Main navigation" className="hidden lg:flex" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {mainNavLinks.map(link => {
                const isActive = hovered === link.label || (link.hasMega && activeMenu === "product") || (link.hasDropdown && activeMenu === "resources");
                
                return (
                  <div 
                    key={link.label} 
                    style={{ position: "relative" }}
                    onMouseEnter={() => {
                      setHovered(link.label);
                      if (link.hasMega) handleMouseEnter("product");
                      else if (link.hasDropdown) handleMouseEnter("resources");
                      else handleMouseLeave();
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      if (link.hasMega || link.hasDropdown) handleMouseLeave();
                    }}
                  >
                    {link.hasMega || link.hasDropdown ? (
                      <button
                        onClick={(e) => handleTap(link.hasMega ? "product" : "resources", e)}
                        onFocus={() => { 
                          setHovered(link.label); 
                          setActiveMenu(link.hasMega ? "product" : "resources"); 
                        }}
                        aria-haspopup="true"
                        aria-expanded={link.hasMega ? activeMenu === "product" : activeMenu === "resources"}
                        style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9rem", padding: "0.5rem 0.75rem", borderRadius: 8, position: "relative" }}
                      >
                        {link.label}
                        {isActive && (
                          <motion.span layoutId={UNDERLINE_ID} style={{ position: "absolute", bottom: 0, left: "0.75rem", right: "0.75rem", height: 2, background: "var(--accent)", borderRadius: 2 }} />
                        )}
                      </button>
                    ) : (
                      <Link href={link.href} style={{ textDecoration: "none", position: "relative" }}>
                        <span style={{ display: "block", padding: "0.5rem 0.75rem", color: "var(--text)", fontSize: "0.9rem", borderRadius: 8 }}>
                          {link.label}
                        </span>
                        {isActive && (
                          <motion.span layoutId={UNDERLINE_ID} style={{ position: "absolute", bottom: 0, left: "0.75rem", right: "0.75rem", height: 2, background: "var(--accent)", borderRadius: 2 }} />
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* RIGHT SIDE */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="hidden lg:flex">
            <Link href="/contact" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: "0.88rem", textDecoration: "none" }}>
              <Headphones size={15} />
              Support
            </Link>
            
            {status === "loading" ? (
              <div style={{ width: 198, height: 40 }} />
            ) : status === "authenticated" ? (
              <div className="flex items-center gap-3 ml-2 relative" onMouseLeave={() => setShowUserMenu(false)}>
                <Link href="/dashboard" style={{ padding: "0.45rem 1rem", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.88rem", textDecoration: "none" }}>
                  Dashboard
                </Link>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onMouseEnter={() => setShowUserMenu(true)}
                  className="w-9 h-9 rounded-full bg-accent text-[#05080F] flex items-center justify-center font-bold text-sm hover:scale-105 transition-transform"
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-[120%] w-48 bg-surface border border-border rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                    >
                      <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm text-text hover:bg-surface-2 transition-colors">Dashboard</Link>
                      <button onClick={logout} className="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-surface-2 transition-colors text-left">Log out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login"
                  style={{ padding: "0.45rem 1rem", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.88rem", textDecoration: "none", transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  Log in
                </Link>
                <motion.a
                  ref={ctaRef}
                  href="/signup"
                  animate={{ x: mag.x, y: mag.y }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  onMouseMove={handleMagMove}
                  onMouseLeave={() => setMag({ x: 0, y: 0 })}
                  className="glow-accent"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.1rem", borderRadius: 9, background: "var(--accent)", color: "#05080F", fontSize: "0.88rem", fontFamily: "var(--font-heading)", fontWeight: 700, textDecoration: "none", cursor: "pointer" }}
                >
                  Get started
                  <motion.span whileHover={{ x: 3 }} style={{ display: "flex" }}>
                    <ArrowRight size={14} />
                  </motion.span>
                </motion.a>
              </>
            )}
          </div>

          {/* MOBILE hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex lg:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "8px", cursor: "pointer" }}
          >
            <Menu size={20} />
          </button>
        </Container>

        {/* NEW PRODUCT MEGA MENU */}
        <AnimatePresence>
          {activeMenu === "product" && (
            <motion.div
              className="absolute left-0 right-0 top-full pointer-events-none"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <Container>
                <div className="pointer-events-auto w-[760px] max-w-full pt-3" onMouseEnter={() => handleMouseEnter("product")}>
                  <MegaMenu onClose={() => setActiveMenu(null)} />
                </div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
