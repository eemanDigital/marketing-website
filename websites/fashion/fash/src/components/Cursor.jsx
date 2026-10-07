"use client";

import { useEffect, useRef } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

const HOVERABLE = "a, button, input, select, textarea, [data-cursor]";

export default function Cursor() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let cleanupFns = [];

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;

        const ring = root.querySelector(".cursor__ring");
        const dot = root.querySelector(".cursor__dot");

        const x = gsap.quickTo(root, "x", { duration: 0.4, ease: "power3" });
        const y = gsap.quickTo(root, "y", { duration: 0.4, ease: "power3" });
        const rx = gsap.quickTo(ring, "x", { duration: 0.7, ease: "power3" });
        const ry = gsap.quickTo(ring, "y", { duration: 0.7, ease: "power3" });

        gsap.set([root, dot, ring], { xPercent: -50, yPercent: -50 });

        const onMove = (e) => {
          x(e.clientX);
          y(e.clientY);
          rx(e.clientX);
          ry(e.clientY);
        };
        window.addEventListener("mousemove", onMove, { passive: true });

        const grow = (on) => {
          gsap.to(ring, {
            scale: on ? 2.2 : 1,
            borderColor: on ? "rgba(194,164,125,.9)" : "rgba(255,255,255,.6)",
            duration: 0.45,
            ease: "power3",
          });
          gsap.to(dot, { scale: on ? 0.5 : 1, duration: 0.45 });
        };

        const over = (e) => {
          const t = e.target.closest?.(HOVERABLE);
          if (t && !t.contains(e.relatedTarget)) grow(true);
        };
        const out = (e) => {
          const t = e.target.closest?.(HOVERABLE);
          if (t && !t.contains(e.relatedTarget)) grow(false);
        };
        document.addEventListener("mouseover", over);
        document.addEventListener("mouseout", out);

        const onLeave = () => gsap.to(root, { autoAlpha: 0, duration: 0.25 });
        const onEnter = () => gsap.to(root, { autoAlpha: 1, duration: 0.25 });
        document.addEventListener("mouseleave", onLeave);
        document.addEventListener("mouseenter", onEnter);

        /* Magnetic pull, delegated so dynamically added buttons work too. */
        const magnets = new WeakMap();
        let current = null;
        const reset = (el) => {
          if (!el) return;
          const m = magnets.get(el);
          if (m) {
            m.mx(0);
            m.my(0);
          }
        };
        const onMagMove = (e) => {
          const el = e.target.closest?.("[data-magnetic]");
          if (el !== current) {
            reset(current);
            current = el;
          }
          if (!el) return;
          let m = magnets.get(el);
          if (!m) {
            m = {
              mx: gsap.quickTo(el, "x", {
                duration: 0.6,
                ease: "elastic.out(1,0.4)",
              }),
              my: gsap.quickTo(el, "y", {
                duration: 0.6,
                ease: "elastic.out(1,0.4)",
              }),
            };
            magnets.set(el, m);
          }
          const r = el.getBoundingClientRect();
          m.mx((e.clientX - (r.left + r.width / 2)) * 0.28);
          m.my((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        window.addEventListener("mousemove", onMagMove, { passive: true });

        cleanupFns.push(() => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mousemove", onMagMove);
          document.removeEventListener("mouseover", over);
          document.removeEventListener("mouseout", out);
          document.removeEventListener("mouseleave", onLeave);
          document.removeEventListener("mouseenter", onEnter);
        });
      } catch {
        /* custom cursor stays hidden (CSS keeps it at opacity 0 by default?) */
      }
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="cursor" id="cursor" ref={rootRef} aria-hidden="true">
      <span className="cursor__ring" />
      <span className="cursor__dot" />
    </div>
  );
}
