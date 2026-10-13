"use client";

import { useEffect, useRef } from "react";

export default function HeroWordmark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    const reveal = revealRef.current;
    // We attach the event listener to the hero section, which is the parent of wrapRef
    const section = wrap?.closest("section");

    if (!section || !box || !reveal) return;

    const isTouch = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || reducedMotion) {
      reveal.style.opacity = "0";
      return;
    }

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let animFrame: number;
    let isHovering = false;
    let currentOpacity = 0;
    let targetOpacity = 0;

    const update = () => {
      // Smooth follow 15% towards target
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      currentOpacity += (targetOpacity - currentOpacity) * 0.15;

      const mask = `radial-gradient(circle 240px at ${currentX}px ${currentY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 100%)`;
      reveal.style.maskImage = mask;
      reveal.style.webkitMaskImage = mask;
      reveal.style.opacity = currentOpacity.toString();

      animFrame = requestAnimationFrame(update);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) {
        isHovering = true;
        targetOpacity = 1;
      }
      const r = box.getBoundingClientRect();
      targetX = e.clientX - r.left;
      targetY = e.clientY - r.top;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      targetOpacity = 0;
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);
    
    // Start animation loop
    animFrame = requestAnimationFrame(update);

    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  // Use the exact font classes as the original footer wordmark + clamp to prevent cropping
  const textClass = "text-[clamp(8rem,24vw,28rem)] leading-[0.75] font-black tracking-tighter";

  return (
    <div 
      ref={wrapRef} 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center select-none" 
      aria-hidden="true"
    >
      <div ref={boxRef} className="relative flex items-center justify-center pointer-events-none -translate-y-8 md:-translate-y-16">
        {/* Layer A (Base): Faint outline */}
        <h1 
          className={`${textClass} text-transparent pointer-events-none`} 
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.05)" }}
        >
          DBaaS
        </h1>
        
        {/* Layer B (Reveal): Bright teal version, absolutely positioned, starts hidden */}
        <h1 
          ref={revealRef}
          className={`${textClass} text-accent absolute inset-0 flex items-center justify-center pointer-events-none`}
          style={{ opacity: 0 }}
        >
          DBaaS
        </h1>
      </div>
    </div>
  );
}
