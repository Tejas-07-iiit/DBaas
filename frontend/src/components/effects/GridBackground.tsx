"use client";
// GridBackground.tsx
// Draws a faint animated grid with glowing dots that move along the lines.
// This runs as a <canvas> element fixed behind all page content.

import { useEffect, useRef } from "react";

// A "dot" is one travelling data packet
type Dot = {
  x: number;        // current position
  y: number;
  targetX: number;  // where it is heading
  targetY: number;
  speed: number;
  opacity: number;
  size: number;
};

const GRID = 52;          // pixels between grid lines
const DOT_COUNT = 18;     // number of travelling dots
const ACCENT = "25, 227, 193"; // our teal color as R,G,B values

function randomGridPoint(w: number, h: number) {
  // Pick a random intersection on the grid
  const cols = Math.floor(w / GRID);
  const rows = Math.floor(h / GRID);
  return {
    x: (Math.floor(Math.random() * cols) + 1) * GRID,
    y: (Math.floor(Math.random() * rows) + 1) * GRID,
  };
}

function makeDot(w: number, h: number): Dot {
  const start = randomGridPoint(w, h);
  const end   = randomGridPoint(w, h);
  return {
    x: start.x, y: start.y,
    targetX: end.x, targetY: end.y,
    speed: 0.4 + Math.random() * 0.6,
    opacity: 0.35 + Math.random() * 0.45,
    size: 2 + Math.random() * 2,
  };
}

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect "prefers-reduced-motion" — if user has this on, skip animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let dots: Dot[] = [];
    let animId: number;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width  = w;
      canvas!.height = h;
      // Re-make dots for new screen size
      dots = Array.from({ length: DOT_COUNT }, () => makeDot(w, h));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // ── 1. Draw the grid lines ──────────────────────────────
      ctx!.strokeStyle = `rgba(130, 160, 200, 0.055)`;
      ctx!.lineWidth = 1;

      // Vertical lines
      for (let x = GRID; x < w; x += GRID) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
        ctx!.stroke();
      }
      // Horizontal lines
      for (let y = GRID; y < h; y += GRID) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      // ── 2. Draw & move the travelling dots ─────────────────
      dots.forEach((dot, i) => {
        // Move dot toward its target along grid axes (X first, then Y)
        const dx = dot.targetX - dot.x;
        const dy = dot.targetY - dot.y;

        if (Math.abs(dx) > 1) {
          dot.x += Math.sign(dx) * dot.speed;
        } else if (Math.abs(dy) > 1) {
          dot.y += Math.sign(dy) * dot.speed;
        } else {
          // Reached target — pick a new destination
          dots[i] = makeDot(w, h);
          dots[i].x = dot.targetX;
          dots[i].y = dot.targetY;
        }

        // Draw the glowing dot
        const grd = ctx!.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.size * 4);
        grd.addColorStop(0,   `rgba(${ACCENT}, ${dot.opacity})`);
        grd.addColorStop(0.5, `rgba(${ACCENT}, ${dot.opacity * 0.3})`);
        grd.addColorStop(1,   `rgba(${ACCENT}, 0)`);
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, dot.size * 4, 0, Math.PI * 2);
        ctx!.fill();

        // Solid center dot
        ctx!.fillStyle = `rgba(${ACCENT}, ${dot.opacity})`;
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, dot.size * 0.7, 0, Math.PI * 2);
        ctx!.fill();
      });

      // ── 3. Fade edges with a vignette gradient ─────────────
      const vignette = ctx!.createRadialGradient(w/2, h/2, h * 0.1, w/2, h/2, h * 0.9);
      vignette.addColorStop(0, "rgba(5, 8, 15, 0)");
      vignette.addColorStop(1, "rgba(5, 8, 15, 0.95)");
      ctx!.fillStyle = vignette;
      ctx!.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"          // screen readers skip this — it's purely decorative
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,                // behind everything else
        pointerEvents: "none",    // clicks pass through it
        opacity: 0.9,
      }}
    />
  );
}
