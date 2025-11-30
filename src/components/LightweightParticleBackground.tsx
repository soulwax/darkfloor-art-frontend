// File: src/components/LightweightParticleBackground.tsx

"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight particle background - resource-saving version
 * Based on the landing page particle system but optimized for performance
 */
export function LightweightParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getParticleCount = () => {
    if (typeof window === "undefined") return 15;
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width >= 1600) return 20;
    if (width >= 1200) return 15;
    if (width >= 900) return 12;
    return 8;
  };

  const createParticles = () => {
    if (!containerRef.current) return;

    // Clear existing particles
    particlesRef.current.forEach((particle) => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    particlesRef.current = [];
    containerRef.current.innerHTML = "";

    const particleCount = getParticleCount();
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "lightweight-particle";

      const size = Math.random() * 8 + 6; // Smaller particles (6-14px)
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 20 + 25; // Slower animation (25-45s)
      const delay = Math.random() * 5;
      const floatX = (Math.random() * 80 - 40).toFixed(2);
      const floatYValue = -(Math.random() * 120 + 60);
      const floatY = floatYValue.toFixed(2);
      const startScale = Math.random() * 0.3 + 0.5;
      const endScale = Math.random() * 0.4 + 0.8;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.setProperty("--float-x", `${floatX}px`);
      particle.style.setProperty("--float-y", `${floatY}px`);
      particle.style.setProperty("--start-scale", startScale.toString());
      particle.style.setProperty("--end-scale", endScale.toString());

      fragment.appendChild(particle);
      particlesRef.current.push(particle);
    }

    containerRef.current.appendChild(fragment);
  };

  useEffect(() => {
    createParticles();

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        createParticles();
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      const currentAnimationFrame = animationFrameRef.current;
      if (currentAnimationFrame !== null) {
        cancelAnimationFrame(currentAnimationFrame);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="lightweight-particle-container"
      aria-hidden="true"
    />
  );
}

