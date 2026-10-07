"use client";

import { useEffect, useRef } from "react";
import { PRESS } from "@/lib/site";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function Press() {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let loop = null;
    const listeners = [];

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;
        loop = gsap.fromTo(
          track,
          { x: 0 },
          {
            x: () => -track.scrollWidth / 2,
            duration: 26,
            ease: "none",
            repeat: -1,
          },
        );
        const slow = () => gsap.to(loop, { timeScale: 0.2, duration: 0.5 });
        const resume = () => gsap.to(loop, { timeScale: 1, duration: 0.5 });
        wrap.addEventListener("mouseenter", slow);
        wrap.addEventListener("mouseleave", resume);
        listeners.push(["mouseenter", slow], ["mouseleave", resume]);
      } catch {
        /* static row of logos */
      }
    })();

    return () => {
      cancelled = true;
      listeners.forEach(([event, handler]) =>
        wrap.removeEventListener(event, handler),
      );
      if (loop) loop.kill();
    };
  }, []);

  return (
    <section className="press" aria-label="Featured in">
      <p className="press__label">Featured In</p>
      <div className="press__viewport" data-press ref={wrapRef}>
        <div className="press__track" ref={trackRef}>
          {[...PRESS, ...PRESS].map((name, i) => (
            <span key={`${name}-${i}`}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
