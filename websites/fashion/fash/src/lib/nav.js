import { scrollToTarget } from "@/lib/gsap";

/**
 * Route-aware navigation.
 * Hash links (#lookbook, #featured, …) only exist on the home page — when we
 * are on another route, stash the target and send the user home first, so a
 * nav click never silently does nothing.
 */
export function navigateTo(router, href) {
  if (href.startsWith("/")) {
    router.push(href);
    return;
  }
  if (window.location.pathname === "/") {
    scrollToTarget(href);
    return;
  }
  sessionStorage.setItem("fash:scroll", href);
  router.push("/");
}

/** Consume a pending hash after arriving on the home page. */
export function consumePendingScroll() {
  const target = sessionStorage.getItem("fash:scroll");
  if (!target) return () => {};
  sessionStorage.removeItem("fash:scroll");
  const start = Date.now();
  let timer = 0;
  let cancelled = false;
  const attempt = () => {
    if (cancelled) return;
    if (document.querySelector(target)) {
      // let the route's own scroll-reset settle before we animate
      timer = window.setTimeout(() => {
        if (!cancelled) scrollToTarget(target);
      }, 240);
      return;
    }
    if (Date.now() - start < 4000) timer = window.setTimeout(attempt, 100);
  };
  attempt();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
