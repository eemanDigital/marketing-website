"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function BackToTop() {
  const btnRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      btn.classList.toggle("is-on", window.scrollY > 700);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClick = async () => {
      if (prefersReducedMotion()) {
        window.scrollTo(0, 0);
        return;
      }
      try {
        const { gsap } = await getGsap();
        gsap.to(window, {
          duration: 1.1,
          ease: "power3.inOut",
          scrollTo: { y: 0, autoKill: true },
        });
      } catch {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    btn.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      btn.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <button className="to-top" type="button" ref={btnRef} aria-label="Back to top">
      <Icon name="arrowUp" />
    </button>
  );
}
