"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { LOOKBOOK } from "@/lib/catalog";
import { getGsap, prefersReducedMotion, scrollToTarget } from "@/lib/gsap";

export default function Lookbook() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const dotsRef = useRef(null);
  const [active, setActive] = useState(-1);
  const apiRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    const dotsWrap = dotsRef.current;
    if (!section || !track || !fill || !dotsWrap) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let mm = null;

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;

        mm = gsap.matchMedia();
        mm.add(
          {
            wide: "(min-width: 821px)",
            reduce: "(prefers-reduced-motion: reduce)",
          },
          (ctx) => {
            const cond = ctx.conditions;
            const panels = Array.from(track.querySelectorAll(".panel"));
            if (!panels.length) return;

            const distance = () =>
              Math.max(1, track.scrollWidth - window.innerWidth);

            const tween = gsap.to(track, {
              x: () => -distance(),
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => "+=" + distance(),
                pin: true,
                scrub: cond.reduce ? true : 0.8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  gsap.set(fill, { scaleX: self.progress });
                  setActive(
                    Math.min(
                      panels.length - 1,
                      Math.round(self.progress * (panels.length - 1)),
                    ),
                  );
                },
                onRefresh: (self) => {
                  gsap.set(fill, { scaleX: self.progress });
                },
              },
            });

            apiRef.current = {
              scrollToPanel(i) {
                const st = tween.scrollTrigger;
                if (!st) return;
                const span = st.end - st.start;
                const ratio =
                  panels.length > 1 ? i / (panels.length - 1) : 0;
                const y = st.start + span * ratio;
                if (cond.reduce) window.scrollTo(0, y);
                else {
                  gsap.to(window, {
                    duration: 1,
                    ease: "power3.inOut",
                    scrollTo: { y, autoKill: true },
                  });
                }
              },
            };

            panels.forEach((panel) => {
              const body = panel.querySelector(".panel__body");
              if (!body) return;
              if (cond.reduce) {
                gsap.set(body.children, { clearProps: "all" });
                return;
              }
              gsap.from(body.children, {
                y: 40,
                autoAlpha: 0,
                duration: 0.9,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: "left 70%",
                  toggleActions: "play none none reverse",
                },
              });
            });
          },
        );
      } catch {
        /* stacked layout remains fully usable without gsap */
      }
    })();

    return () => {
      cancelled = true;
      apiRef.current = null;
      if (mm) mm.revert();
    };
  }, []);

  return (
    <section className="lookbook dark" id="lookbook" ref={sectionRef}>
      <div className="lookbook__head">
        <div className="lookbook__head-row shell">
          <h2 className="lookbook__title">
            The<br />
            Lookbook
          </h2>
          <p className="lookbook__hint">
            <Icon name="arrowLong" aria-hidden="true" />
            Keep scrolling to explore
          </p>
        </div>
      </div>

      <div className="lookbook__track" id="galleryContainer" ref={trackRef}>
        {LOOKBOOK.map((p) => (
          <article className="panel" key={p.num}>
            <div className="panel__media">
              <span className="panel__num" aria-hidden="true">
                {p.num}
              </span>
              <Image
                src={p.img}
                alt={p.alt}
                fill
                sizes="(max-width: 820px) 90vw, 38vw"
                quality={80}
              />
            </div>
            <div className="panel__body">
              <span className="panel__label">{p.label}</span>
              <h3 className="panel__title">
                {p.title.split("\n").map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </h3>
              <p className="panel__copy">{p.copy}</p>
              <ul className="panel__list">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <a
                className="ulink"
                href="#essentials"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget("#essentials");
                }}
              >
                {p.cta}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="lookbook__foot shell">
        <div className="lookbook__bar" aria-hidden="true">
          <span ref={fillRef} />
        </div>
        <div className="lookbook__dots" ref={dotsRef}>
          {LOOKBOOK.map((p, i) => (
            <button
              key={p.num}
              type="button"
              aria-current={active === i ? "true" : "false"}
              aria-label={`Go to lookbook panel ${i + 1}`}
              onClick={() => apiRef.current?.scrollToPanel(i)}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
