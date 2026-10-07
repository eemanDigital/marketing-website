"use client";

import { useEffect } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

const HIDDEN = {
  "": { opacity: 0, x: 0, y: 34, scale: 1, clipPath: "none" },
  left: { opacity: 0, x: -40, y: 0, scale: 1, clipPath: "none" },
  right: { opacity: 0, x: 40, y: 0, scale: 1, clipPath: "none" },
  scale: { opacity: 0, x: 0, y: 0, scale: 1.06, clipPath: "none" },
  clip: { opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0 0 100% 0)" },
};

const SHOWN = { opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)" };

export default function Reveals() {
  useEffect(() => {
    let cancelled = false;
    let ctx = null;
    let revealStragglers = () => {};
    let timers = [];

    const fallbackCounters = () => {
      /* Counters already show their final value in the HTML. */
    };

    (async () => {
      try {
        const { gsap, ScrollTrigger } = await getGsap();
        if (cancelled || prefersReducedMotion()) {
          fallbackCounters();
          return;
        }

        ctx = gsap.context(() => {
          const reveals = gsap.utils.toArray("[data-reveal]");

          /* Hide only what the visitor cannot see yet — anything already in
             view stays visible so the first paint never flashes. */
          reveals.forEach((el) => {
            const variant = el.getAttribute("data-reveal") || "";
            const state = HIDDEN[variant] || HIDDEN[""];
            if (el.getBoundingClientRect().top > window.innerHeight) {
              gsap.set(el, state);
            } else {
              gsap.set(el, SHOWN);
            }
          });

          ScrollTrigger.batch("[data-reveal]", {
            start: "top 88%",
            once: true,
            onEnter: (batch) => {
              gsap.to(batch, {
                ...SHOWN,
                duration: 1.05,
                stagger: 0.12,
                ease: "power3.out",
                overwrite: true,
              });
            },
          });

          revealStragglers = () => {
            document.querySelectorAll("[data-reveal]").forEach((el) => {
              if (parseFloat(getComputedStyle(el).opacity) > 0.9) return;
              if (el.getBoundingClientRect().top > window.innerHeight * 1.05)
                return;
              gsap.to(el, {
                ...SHOWN,
                duration: 0.7,
                ease: "power2.out",
                overwrite: true,
              });
            });
          };

          document.querySelectorAll("[data-count]").forEach((el) => {
            const target = parseFloat(el.getAttribute("data-count")) || 0;
            ScrollTrigger.create({
              trigger: el,
              start: "top 94%",
              once: true,
              onEnter: () => {
                const o = { v: 0 };
                gsap.to(o, {
                  v: target,
                  duration: 1.9,
                  ease: "power2.out",
                  onUpdate: () => {
                    el.textContent = String(Math.round(o.v));
                  },
                });
              },
            });
          });
        });

        /* Armed straight away: a slow font or image must never leave content
           stuck invisible. */
        timers.push(setTimeout(() => revealStragglers(), 2600));
        timers.push(setTimeout(() => revealStragglers(), 6000));

        const imgs = Array.from(document.images || []);
        Promise.all(
          imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : null)),
        ).then(() => {
          if (cancelled) return;
          ScrollTrigger.refresh();
          revealStragglers();
        });

        if (document.fonts?.ready) {
          document.fonts.ready.then(() => {
            if (cancelled) return;
            ScrollTrigger.refresh();
            revealStragglers();
          });
        }

        let queued = false;
        const onScroll = () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            revealStragglers();
          });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        timers.push(() => window.removeEventListener("scroll", onScroll));
      } catch {
        /* gsap unavailable — content stays fully visible */
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => (typeof t === "number" ? clearTimeout(t) : t()));
      if (ctx) ctx.revert();
    };
  }, []);

  return null;
}
