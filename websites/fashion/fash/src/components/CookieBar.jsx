"use client";

import { useEffect, useRef, useState } from "react";

export default function CookieBar() {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem("fash:cookie");
    } catch {
      /* storage unavailable — hide the bar */
      return;
    }
    if (stored) return;
    const t = window.setTimeout(() => setShow(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!show || !el) return;
    const raf = requestAnimationFrame(() => el.classList.add("is-ready"));

    const decide = (value) => {
      try {
        localStorage.setItem("fash:cookie", value);
      } catch {}
      el.classList.remove("is-ready");
      window.setTimeout(() => setShow(false), 650);
    };
    const onAccept = () => decide("accepted");
    const onDecline = () => decide("declined");
    el.querySelector('[data-accept]')?.addEventListener("click", onAccept);
    el.querySelector('[data-decline]')?.addEventListener("click", onDecline);
    return () => {
      cancelAnimationFrame(raf);
      el.querySelector('[data-accept]')?.removeEventListener("click", onAccept);
      el.querySelector('[data-decline]')?.removeEventListener("click", onDecline);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="cookie" role="region" aria-label="Cookie notice" ref={ref}>
      <p>
        We use cookies to keep the atelier running and improve your experience.
        Read more in our{" "}
        <a href="#top">privacy policy</a>.
      </p>
      <div className="cookie__acts">
        <button className="btn btn--outline" type="button" data-decline>
          <span>Decline</span>
        </button>
        <button className="btn btn--solid" type="button" data-accept>
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
}