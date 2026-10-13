"use client";
// Logo.tsx
// The DBaaS logo: three rounded blocks (Mongo green, Postgres blue, Qdrant pink)
// stacked and slightly overlapping to show "three databases in one".
// On hover the blocks shift apart slightly.

import Link from "next/link";
import { motion } from "motion/react";

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="DBaaS home"
      className="flex items-center gap-2.5 select-none"
    >
      {/* ── The three-block mark ── */}
      <motion.div
        className="relative"
        style={{ width: 32, height: 36 }}
        whileHover="hovered"
      >
        {/* Block 1 — MongoDB green (top) */}
        <motion.div
          className="absolute left-0 rounded-md"
          style={{ width: 20, height: 11, background: "#3FCF6D", top: 0, left: 6 }}
          variants={{ hovered: { y: -3, x: 0 } }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
        {/* Block 2 — PostgreSQL blue (middle) */}
        <motion.div
          className="absolute rounded-md"
          style={{ width: 26, height: 11, background: "#4C8DFF", top: 12, left: 3 }}
          variants={{ hovered: { x: -3 } }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
        {/* Block 3 — Qdrant pink (bottom) */}
        <motion.div
          className="absolute rounded-md"
          style={{ width: 20, height: 11, background: "#FF4D8D", top: 24, left: 6 }}
          variants={{ hovered: { y: 3, x: 0 } }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
      </motion.div>

      {/* ── Wordmark ── */}
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "1.2rem",
          color: "var(--text)",
          letterSpacing: "-0.03em",
        }}
      >
        DB<span style={{ color: "var(--accent)" }}>aaS</span>
      </span>
    </Link>
  );
}
