const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteHeader && siteNav) {
  const setMenuOpen = (isOpen) => {
    siteHeader.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !siteHeader.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  window
    .matchMedia("(min-width: 821px)")
    .addEventListener("change", (event) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    });
}

const updateHeaderOnScroll = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeaderOnScroll();
window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const revealTargets = document.querySelectorAll(
    [
      ".hero-content",
      ".hero-visual",
      ".services-header",
      ".service-card",
      ".services-bottom",
      ".about-visual",
      ".about-content",
      ".process-header",
      ".process-step",
      ".process-cta",
      ".testimonials-header",
      ".testimonial-card",
      ".testimonials-cta",
      ".contact-info-col",
      ".contact-form-col",
      ".contact-bottom",
      ".footer-container",
    ].join(", "),
  );

  [".services-grid", ".process-timeline", ".testimonials-grid"].forEach(
    (selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        Array.from(group.children).forEach((item, index) => {
          item.style.setProperty(
            "--reveal-delay",
            `${Math.min(index * 90, 360)}ms`,
          );
        });
      });
    },
  );

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
  );

  revealTargets.forEach((target) => {
    target.classList.add("scroll-reveal");
    revealObserver.observe(target);
  });
}
