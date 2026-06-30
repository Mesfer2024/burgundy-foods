"use client";

import { useEffect, useRef } from "react";

/**
 * Reveal-on-scroll using IntersectionObserver. Adds data-revealed="true" to
 * elements with .cinema-reveal inside the ref'd container once they enter
 * the viewport. Vanilla — no animation library.
 */
export function useCinemaReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(".cinema-reveal");
    if (targets.length === 0) return;

    // Respect reduced-motion: skip IO and reveal immediately
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.setAttribute("data-revealed", "true"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute("data-revealed", "true");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}
