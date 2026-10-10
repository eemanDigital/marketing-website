"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { NAV_LINKS, MENU_LINKS } from "@/lib/site";
import { getGsap } from "@/lib/gsap";
import { navigateTo, consumePendingScroll } from "@/lib/nav";

export default function SiteHeader() {
  const { items, saved, openPanel } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef(null);
  const progressRef = useRef(null);
  const menuRef = useRef(null);
  const burgerRef = useRef(null);
  const closeRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = items.reduce((n, i) => n + i.qty, 0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle("is-stuck", y > 60);
      if (y > 400 && y > lastY + 6) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 400) header.classList.remove("is-hidden");
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      }
      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const links = Array.from(document.querySelectorAll(".nav__link"));
    links.forEach((l) => l.classList.remove("is-active"));
    if (pathname !== "/") return;
    const hashLinks = links.filter((l) =>
      (l.getAttribute("href") || "").startsWith("#"),
    );
    const sections = hashLinks
      .map((l) => document.querySelector(l.getAttribute("href")))
      .filter(Boolean);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          hashLinks.forEach((l) =>
            l.classList.toggle(
              "is-active",
              l.getAttribute("href") === `#${entry.target.id}`,
            ),
          );
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    return consumePendingScroll();
  }, [pathname]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (!menuOpen) return;

    menu.style.visibility = "visible";
    menu.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
    closeRef.current?.focus();

    let ctx;
    let cancelled = false;
    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;
        ctx = gsap.context(() => {
          gsap
            .timeline()
            .fromTo(
              menu,
              { clipPath: "inset(0 0 100% 0)" },
              { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power4.inOut" },
            )
            .from(
              ".mobile-menu__list li",
              { y: 40, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" },
              "-=0.35",
            )
            .from(
              ".mobile-menu__foot > *",
              { y: 20, autoAlpha: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" },
              "-=0.4",
            );
        }, menu);
      } catch {
        /* menu is visible via inline style — still usable without gsap */
      }
    })();

    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
      if (e.key !== "Tab") return;
      const focusables = menu.querySelectorAll("a, button");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKey);
      if (ctx) ctx.revert();
      menu.removeAttribute("style");
      menu.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-locked");
      burgerRef.current?.focus();
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (menuOpen) closeMenu();
    navigateTo(router, href);
  };

  const showSaved = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("fash:show-saved"));
    router.push("/collection?view=saved");
  };

  return (
    <>
      <header className="nav" id="mainHeader" ref={headerRef}>
        <div className="nav__progress" ref={progressRef} aria-hidden="true" />
        <div className="nav__inner shell">
          <a
            className="nav__logo"
            href="#top"
            onClick={(e) => handleNavClick(e, "#top")}
          >
            FASH
          </a>

          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                className="nav__link"
                href={l.href}
                aria-current={l.href === pathname ? "page" : undefined}
                onClick={(e) => handleNavClick(e, l.href)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nav__tools">
            <button
              className="icon-btn"
              type="button"
              aria-label="Search products"
              aria-haspopup="dialog"
              onClick={() => openPanel("search")}
            >
              <Icon name="search" />
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Show saved items"
              onClick={showSaved}
            >
              <Icon name="heart" />
              {saved.length > 0 && (
                <span className="icon-btn__badge">{saved.length}</span>
              )}
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Open shopping bag"
              aria-haspopup="dialog"
              onClick={() => openPanel("cart")}
            >
              <Icon name="bag" />
              {cartCount > 0 && (
                <span className="icon-btn__badge">{cartCount}</span>
              )}
            </button>
            <button
              className={`burger${menuOpen ? " is-on" : ""}`}
              type="button"
              ref={burgerRef}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobileMenu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className="mobile-menu"
        id="mobileMenu"
        ref={menuRef}
        aria-hidden={!menuOpen}
      >
        <button
          className="mobile-menu__close"
          type="button"
          ref={closeRef}
          aria-label="Close menu"
          onClick={closeMenu}
        >
          <Icon name="close" />
        </button>
        <ul className="mobile-menu__list">
          {MENU_LINKS.map((l, i) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => handleNavClick(e, l.href)}>
                <i>{String(i + 1).padStart(2, "0")}</i> {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mobile-menu__foot">
          <button type="button" onClick={() => { closeMenu(); openPanel("sizeguide"); }}>
            Size Guide
          </button>
          <button
            type="button"
            onClick={(e) => handleNavClick(e, "#care")}
          >
            Book a Fitting
          </button>
          <button
            type="button"
            onClick={() => { closeMenu(); openPanel("cart"); }}
          >
            Shopping Bag
          </button>
          <a href="tel:+2347003284277">Call the Atelier</a>
        </div>
      </div>
    </>
  );
}
