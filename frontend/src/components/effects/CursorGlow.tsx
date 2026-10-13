"use client";
// CursorGlow.tsx
// A soft teal radial glow that follows the user's mouse cursor.
// Purely decorative — only shows on desktop (pointer: fine means a mouse, not a finger).

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run if the device has a precise pointer (mouse), not a touchscreen
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFine || reducedMotion) return;

    const el = divRef.current;
    if (!el) return;

    // Show the glow
    el.style.opacity = "1";

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let currentX = x;
    let currentY = y;
    let animId: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    // Smooth follow — the glow lags slightly behind the cursor
    function animate() {
      currentX += (x - currentX) * 0.09;
      currentY += (y - currentY) * 0.09;
      el!.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      animId = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={divRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1,              // just above the grid, below all content
        width: 520,
        height: 520,
        borderRadius: "50%",
        opacity: 0,             // starts hidden; JS turns it on
        pointerEvents: "none",  // clicks pass through
        background: "radial-gradient(circle, rgba(25,227,193,0.055) 0%, rgba(25,227,193,0.02) 35%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
