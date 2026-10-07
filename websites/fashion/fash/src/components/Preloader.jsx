"use client";

import { useEffect, useRef } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function Preloader() {
  const rootRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let ctx;

    const finish = () => {
      root.style.display = "none";
      document.documentElement.classList.remove("is-locked");
      document.documentElement.dataset.revealed = "1";
      document.dispatchEvent(new CustomEvent("fash:revealed"));
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    document.documentElement.classList.add("is-locked");

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;
        const counter = { v: 0 };
        ctx = gsap.context(() => {
          const tl = gsap.timeline({ onComplete: finish });
          tl.to(counter, {
            v: 100,
            duration: 1.4,
            ease: "power2.inOut",
            onUpdate: () => {
              if (countRef.current) {
                countRef.current.textContent = String(Math.round(counter.v));
              }
            },
          })
            .to(".preloader__bar span", { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0)
            .to(".preloader__count", { yPercent: -110, duration: 0.55, ease: "power3.inOut" })
            .to([".preloader__mark", ".preloader__label"], { autoAlpha: 0, duration: 0.3 }, "<0.1")
            .to(root, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "-=0.25");
        }, root);
      } catch {
        finish();
      }
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div className="preloader" ref={rootRef} role="status" aria-label="Loading">
      <div className="preloader__inner">
        <div className="preloader__mark">F</div>
        <div className="preloader__count" ref={countRef}>
          0
        </div>
        <p className="preloader__label">Preparing the collection</p>
      </div>
      <div className="preloader__bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
