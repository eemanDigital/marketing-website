"use client";

import { useEffect, useRef } from "react";
import { MARQUEE_ITEMS } from "@/lib/site";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function Marquee() {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let loop = null;

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;
        loop = gsap.to(track, {
          xPercent: -50,
          duration: Math.max(18, MARQUEE_ITEMS.length * 3.2),
          ease: "none",
          repeat: -1,
        });
        wrap.addEventListener("mouseenter", () =>
          gsap.to(loop, { timeScale: 0.25, duration: 0.5 }),
        );
        wrap.addEventListener("mouseleave", () =>
          gsap.to(loop, { timeScale: 1, duration: 0.5 }),
        );
      } catch {
        /* static marquee is fine */
      }
    })();

    return () => {
      cancelled = true;
      if (loop) loop.kill();
    };
  }, []);

  const group = (
    <div className="marquee__group">
      {MARQUEE_ITEMS.map((t) => (
        <span key={t}>
          {t}
          <i aria-hidden="true">•</i>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" data-marquee ref={wrapRef}>
      <div className="marquee__track" ref={trackRef}>
        {group}
        {group}
      </div>
    </div>
  );
}
