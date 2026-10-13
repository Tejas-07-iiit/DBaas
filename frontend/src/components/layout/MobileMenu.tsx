"use client";
// MobileMenu.tsx
// Full-screen overlay menu for phones and tablets.
// Opens when user taps the hamburger (≡) button.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown } from "lucide-react";
import {
  mainNavLinks,
  productDatabases,
  productPlatformLinks,
} from "@/data/navigation";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth/AuthProvider";

// A collapsible section (accordion) for Product/Resources
function Accordion({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          background: "none",
          border: "none",
          color: "var(--text)",
          fontFamily: "var(--font-heading)",
          fontSize: "1.1rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
        aria-expanded={open}
      >
        {label}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} color="var(--muted)" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: "0.75rem" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { status, logout } = useAuth();
  
  // Lock the page from scrolling while menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
    return () => document.body.classList.remove("scroll-locked");
  }, [isOpen]);

  // Close menu when Escape key is pressed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // List of simple nav links (not Product or Resources which have submenus)
  const simpleLinks = mainNavLinks.filter(l => !l.hasMega && !l.hasDropdown);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "var(--bg)",
            padding: "0 1.25rem",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* ── Top bar: logo + close button ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "var(--nav-h)", flexShrink: 0 }}>
            <Logo />
            <button
              onClick={onClose}
              aria-label="Close menu"
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Navigation links ── */}
          <nav style={{ flex: 1, paddingTop: "0.5rem" }} aria-label="Mobile navigation">
            {/* Product accordion */}
            <Accordion label="Product">
              <div style={{ paddingLeft: "0.5rem" }}>
                {productDatabases.map((db, i) => (
                  <motion.div
                    key={db.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={db.href} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0", textDecoration: "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: db.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ color: "var(--text)", fontSize: "1rem" }}>{db.name}</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: 4 }}>— {db.tagline}</span>
                    </Link>
                  </motion.div>
                ))}
                {/* Platform links */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {productPlatformLinks.map(l => (
                    <Link key={l.label} href={l.href} onClick={onClose}
                      style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", padding: "2px 10px", border: "1px solid var(--border)", borderRadius: 20 }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </Accordion>

            {/* Simple links */}
            {simpleLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <Link href={link.href} onClick={onClose}
                  style={{ display: "block", padding: "1rem 0", color: "var(--text)", fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600, textDecoration: "none" }}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* ── Bottom CTAs ── */}
          <div style={{ padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
            {status === "loading" ? (
              <div style={{ height: 104 }} />
            ) : status === "authenticated" ? (
              <>
                <Link href="/dashboard" onClick={onClose}
                  style={{
                    textAlign: "center", padding: "0.8rem", borderRadius: 10,
                    border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)",
                    fontFamily: "var(--font-heading)", fontWeight: 600, textDecoration: "none",
                  }}>
                  Dashboard
                </Link>
                <button onClick={() => { logout(); onClose(); }}
                  style={{
                    textAlign: "center", padding: "0.8rem", borderRadius: 10,
                    border: "1px solid var(--border)", color: "#f87171", background: "transparent",
                    fontFamily: "var(--font-heading)", fontWeight: 600,
                  }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={onClose}
                  style={{
                    textAlign: "center", padding: "0.8rem", borderRadius: 10,
                    border: "1px solid var(--border)", color: "var(--text)",
                    fontFamily: "var(--font-heading)", fontWeight: 600, textDecoration: "none",
                  }}>
                  Log in
                </Link>
                <Link href="/signup" onClick={onClose}
                  style={{
                    textAlign: "center", padding: "0.8rem", borderRadius: 10,
                    background: "var(--accent)", color: "#05080F",
                    fontFamily: "var(--font-heading)", fontWeight: 700, textDecoration: "none",
                  }}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
