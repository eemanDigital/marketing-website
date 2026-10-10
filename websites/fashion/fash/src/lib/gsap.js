/* Shared GSAP access — dynamically imported so the animation runtime is
   code-split out of the server render and loaded once, on demand. */
let promise = null;

export function getGsap() {
  if (!promise) {
    promise = (async () => {
      const [{ gsap }, { ScrollTrigger }, { ScrollToPlugin }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/ScrollToPlugin"),
      ]);
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      ScrollTrigger.config({ ignoreMobileResize: true });
      return { gsap, ScrollTrigger, ScrollToPlugin };
    })().catch((err) => {
      promise = null;
      throw err;
    });
  }
  return promise;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export async function scrollToTarget(target, offset = 96) {
  const el =
    typeof target === "string"
      ? document.querySelector(target)
      : target instanceof Element
        ? target
        : null;
  if (!el) return;
  if (prefersReducedMotion()) {
    el.scrollIntoView();
    return;
  }
  const top = Math.max(
    0,
    el.getBoundingClientRect().top + window.scrollY - offset,
  );
  // ScrollToPlugin fights the global `html { scroll-behavior: smooth }`
  // (the browser animates each tick and the tween never lands), so disable
  // it for the duration of the tween.
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  const restore = () => {
    html.style.scrollBehavior = prev;
  };
  try {
    const { gsap } = await getGsap();
    gsap.killTweensOf(window);
    gsap.to(window, {
      duration: 1.1,
      scrollTo: { y: top, autoKill: false },
      ease: "power3.inOut",
      onComplete: restore,
    });
  } catch {
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(restore, 900);
  }
}
