"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/site";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";
import { navigateTo } from "@/lib/nav";
import { useStore } from "@/components/StoreProvider";

function Newsletter() {
  const { toast } = useStore();
  const [msg, setMsg] = useState(null);
  const fieldRef = useRef(null);
  const inputRef = useRef(null);
  const btnRef = useRef(null);

  const say = (text, state) => setMsg({ text, state });

  useEffect(() => {
    if (!msg || prefersReducedMotion()) return;
    let cancelled = false;
    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled || !fieldRef.current) return;
        gsap.fromTo(
          fieldRef.current.parentElement.querySelector(".news__msg"),
          { autoAlpha: 0, y: -4 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
        );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [msg]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const input = inputRef.current;
    const field = fieldRef.current;
    if (!input || !field) return;
    const value = input.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

    if (!ok) {
      field.classList.add("is-error");
      say("Please enter a valid email address.", "error");
      if (!prefersReducedMotion()) {
        try {
          const { gsap } = await getGsap();
          gsap.fromTo(
            field,
            { x: -7 },
            { x: 0, duration: 0.55, ease: "elastic.out(1,0.35)" },
          );
        } catch {}
      }
      input.focus();
      return;
    }

    if (btnRef.current) btnRef.current.disabled = true;
    field.classList.add("is-ok");
    say("Checking availability", "ok");

    window.setTimeout(() => {
      if (btnRef.current) btnRef.current.disabled = false;
      field.classList.remove("is-ok");
      input.value = "";
      say("Welcome to the list. Enjoy 10% off your first order.", "ok");
      toast("Subscribed — check your inbox", "check");
    }, 1100);
  };

  return (
    <div className="news">
      <h3>Join The List</h3>
      <p>
        Sign up for first look at limited festive drops and private sales.
      </p>
      <form noValidate onSubmit={onSubmit}>
        <div className="news__field" ref={fieldRef}>
          <label className="sr-only" htmlFor="newsletterEmail">
            Email address
          </label>
          <input
            type="email"
            id="newsletterEmail"
            name="email"
            placeholder="Enter your email address"
            autoComplete="email"
            required
            aria-describedby="newsletterMsg"
            aria-invalid={msg?.state === "error"}
            ref={inputRef}
            onChange={() => {
              fieldRef.current?.classList.remove("is-error");
              if (msg?.state === "error") setMsg(null);
            }}
          />
          <button type="submit" aria-label="Subscribe" ref={btnRef}>
            <Icon name="arrowRight" />
          </button>
        </div>
        <p
          className="news__msg"
          id="newsletterMsg"
          role="status"
          aria-live="polite"
          data-state={msg?.state}
        >
          {msg?.text}
        </p>
      </form>
    </div>
  );
}

const SHOP_LINKS = [
  { label: "Kaftans", href: "/collection?cat=Kaftan" },
  { label: "Safari Suits", href: "/collection?cat=Safari%20Suit" },
  { label: "Tunics", href: "/collection?cat=Tunic" },
  { label: "Featured", href: "#featured" },
];

export default function SiteFooter() {
  const { openPanel } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const year = new Date().getFullYear();

  const nav = (e, href) => {
    e.preventDefault();
    navigateTo(router, href);
  };

  return (
    <footer className="footer dark" id="footer">
      <div className="shell">
        <div className="footer__grid">
          <div className="footer__brand">
            <h2>FASH</h2>
            <p>
              Nigerian native dress, made properly. Follow us for new fabric
              drops, styling notes and early access to festive collections.
            </p>
          </div>

          <nav className="footer__nav" aria-label="Shop">
            <h3>Shop</h3>
            <ul className="footer__links">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                  href={l.href}
                  aria-current={l.href === pathname ? "page" : undefined}
                  onClick={(e) => nav(e, l.href)}
                >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer__nav" aria-label="Client services">
            <h3>Client Care</h3>
            <ul className="footer__links">
              <li>
                <a href="#care" onClick={(e) => nav(e, "#care")}>
                  Shipping &amp; Returns
                </a>
              </li>
              <li>
                <button type="button" onClick={() => openPanel("sizeguide")}>
                  Size Guide
                </button>
              </li>
              <li>
                <a href="#care" onClick={(e) => nav(e, "#care")}>
                  Book a Fitting
                </a>
              </li>
              <li>
                <a href="#care" onClick={(e) => nav(e, "#care")}>
                  Fabric Care
                </a>
              </li>
            </ul>
          </nav>

          <Newsletter />
        </div>

        <div className="footer__bottom">
          <span>
            &copy; {year} Fash Clothings. All rights reserved.
          </span>
          <div className="footer__legal">
            <a href="#top" onClick={(e) => nav(e, "#top")}>
              Privacy
            </a>
            <a href="#top" onClick={(e) => nav(e, "#top")}>
              Terms
            </a>
            <a href="#top" onClick={(e) => nav(e, "#top")}>
              Accessibility
            </a>
          </div>
          <div className="socials">
            <a
              href={SITE.socials.pinterest}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
            >
              <Icon name="pinterest" />
            </a>
            <a
              href={SITE.socials.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              <Icon name="x" />
            </a>
            <a
              href={SITE.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Icon name="instagram" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
