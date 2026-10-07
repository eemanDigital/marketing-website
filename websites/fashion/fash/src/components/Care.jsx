"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { CONTACT_REASONS, FAQS } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function Care() {
  const { toast } = useStore();
  const [open, setOpen] = useState(0);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const answersRef = useRef([]);
  const formRef = useRef(null);

  useEffect(() => {
    answersRef.current.forEach((el, i) => {
      if (!el) return;
      el.style.height = open === i ? `${el.scrollHeight}px` : "0px";
    });
  }, [open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const next = {};
    if (!String(data.get("name") || "").trim()) next.name = "Please tell us your name.";
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      next.email = "Please enter a valid email address.";
    if (!String(data.get("message") || "").trim())
      next.message = "Add a short note so we can help.";
    setErrors(next);

    if (Object.keys(next).length) {
      setStatus({ text: "Please fix the highlighted fields.", state: "error" });
      form.querySelector("input, textarea")?.focus();
      return;
    }

    setStatus({ text: "Sending your request…", state: "ok" });
    window.setTimeout(() => {
      form.reset();
      setStatus({
        text: "Received — the atelier replies within one working day.",
        state: "ok",
      });
      toast("Fitting request sent to the atelier", "check");
    }, 900);
  };

  useEffect(() => {
    if (!status || prefersReducedMotion()) return;
    let cancelled = false;
    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;
        gsap.fromTo(
          ".care__status",
          { autoAlpha: 0, y: -4 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
        );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <section className="care" id="care">
      <div className="shell">
        <header className="section-head" data-reveal>
          <h2>Questions &amp; Care</h2>
          <p>Everything before and after the order</p>
        </header>

        <div className="care__grid">
          <div className="faq" data-reveal>
            {FAQS.map((f, i) => (
              <div className="faq__item" key={f.q}>
                <button
                  className="faq__q"
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="faq__sign" aria-hidden="true" />
                </button>
                <div
                  className="faq__a"
                  id={`faq-panel-${i}`}
                  ref={(el) => {
                    answersRef.current[i] = el;
                  }}
                >
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="care__panel" data-reveal>
            <h3>Book a Fitting</h3>
            <p>
              Tell us what you are dressing for and when. We reply within one
              working day with fabric options and a fitting slot at the
              Victoria Island atelier.
            </p>
            <form ref={formRef} noValidate onSubmit={onSubmit}>
              <div className={`field${errors.name ? " is-error" : ""}`}>
                <label htmlFor="careName">Your name</label>
                <input
                  id="careName"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Adaeze Okonkwo"
                  onChange={() => setErrors((e) => ({ ...e, name: undefined }))}
                />
                <span className="field__err">{errors.name || ""}</span>
              </div>

              <div className={`field${errors.email ? " is-error" : ""}`}>
                <label htmlFor="careEmail">Email</label>
                <input
                  id="careEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  onChange={() => setErrors((e) => ({ ...e, email: undefined }))}
                />
                <span className="field__err">{errors.email || ""}</span>
              </div>

              <div className="field">
                <label htmlFor="careReason">What do you need?</label>
                <select id="careReason" name="reason" defaultValue={CONTACT_REASONS[0]}>
                  {CONTACT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className="field__err" />
              </div>

              <div className={`field${errors.message ? " is-error" : ""}`}>
                <label htmlFor="careMessage">Details</label>
                <textarea
                  id="careMessage"
                  name="message"
                  placeholder="Occasion, date, colours you like…"
                  onChange={() =>
                    setErrors((e) => ({ ...e, message: undefined }))
                  }
                />
                <span className="field__err">{errors.message || ""}</span>
              </div>

              <button className="btn btn--solid" type="submit">
                <span>Send request</span>
              </button>

              {status && (
                <p className="care__status" data-state={status.state} role="status">
                  {status.text}
                </p>
              )}
            </form>

            <div className="care__contact">
              <div>
                <Icon name="phone" aria-hidden="true" />
                <a href={SITE.phoneHref}>{SITE.phone}</a>
              </div>
              <div>
                <Icon name="mail" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </div>
              <div>
                <Icon name="pin" aria-hidden="true" />
                <span>
                  {SITE.address.street}, {SITE.address.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
