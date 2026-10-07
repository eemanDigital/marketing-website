"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { HERO_SLIDES, HERO_STATS } from "@/lib/catalog";
import { naira } from "@/lib/format";
import { getGsap, prefersReducedMotion, scrollToTarget } from "@/lib/gsap";

const AUTOPLAY = 6;
/* The stage stays locked for this long after a swap so the two-layer
   entrance (form first, model second) always finishes unbroken. */
const HOLD = 1500;

export default function Hero() {
  const { openQuickView } = useStore();
  const [index, setIndex] = useState(0);
  const [gsap, setGsap] = useState(null);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const lookRef = useRef(null);
  const gaugeRef = useRef(null);
  const statusRef = useRef(null);

  const gsapRef = useRef(null);
  const indexRef = useRef(0);
  const prevRef = useRef(0);
  const busyRef = useRef(false);
  const pausedRef = useRef(false);
  const autoRef = useRef(null);
  const introPlayed = useRef(false);
  const depthRef = useRef(null);

  const total = HERO_SLIDES.length;

  const stopAuto = () => {
    if (autoRef.current) {
      autoRef.current.kill();
      autoRef.current = null;
    }
    if (fillRef.current && gsapRef.current) {
      gsapRef.current.set(fillRef.current, { scaleY: 0 });
    }
  };

  const startAuto = () => {
    const g = gsapRef.current;
    const fill = fillRef.current;
    stopAuto();
    if (!g || !fill) return;
    if (prefersReducedMotion() || pausedRef.current || document.hidden) return;
    autoRef.current = g.fromTo(
      fill,
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: AUTOPLAY,
        ease: "none",
        onComplete: () => {
          autoRef.current = null;
          goTo(indexRef.current + 1);
        },
      },
    );
  };

  const goTo = (next, manual = false) => {
    const target = ((next % total) + total) % total;
    if (busyRef.current || target === indexRef.current) return;
    if (manual) {
      stopAuto();
      pausedRef.current = true;
      window.setTimeout(() => {
        pausedRef.current = false;
        startAuto();
      }, AUTOPLAY * 750);
    }
    setIndex(target);
  };

  /* Slide swap. Every look is a pair — the dress form is cut into view
     first, then the model steps in over it, so the stage reads as
     "built on the form, finished on the body". Leaving looks run the
     same sequence backwards: model off first, form after. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children);
    const from = prevRef.current;
    prevRef.current = index;

    if (statusRef.current) {
      const s = HERO_SLIDES[index];
      statusRef.current.textContent = `Look ${index + 1} of ${total}: ${s.title}`;
    }

    /* Seam gauge on the left edge of the frame tracks the current look */
    const gauge = gaugeRef.current;
    if (gauge) {
      const pos = `${8 + (index / Math.max(1, total - 1)) * 84}%`;
      if (gsap && !prefersReducedMotion()) {
        gsap.to(gauge, { top: pos, duration: 0.7, ease: "power3.inOut" });
      } else {
        gauge.style.top = pos;
      }
    }

    const g = gsap;
    if (!g || prefersReducedMotion() || from === index) {
      if (!g || !introPlayed.current) startAuto();
      return;
    }

    const out = slides[from];
    const inn = slides[index];
    if (!out || !inn) return;

    const tl = g.timeline();

    tl.to(
      [out.querySelector(".slide__figure"), out.querySelector(".pin")],
      { autoAlpha: 0, y: -30, duration: 0.45, ease: "power2.in" },
      0,
    )
      .to(
        out.querySelectorAll(".slide__tag"),
        { autoAlpha: 0, y: -12, duration: 0.4, ease: "power2.in" },
        0,
      )
      .to(
        out.querySelector(".slide__form"),
        { autoAlpha: 0, y: 22, duration: 0.45, ease: "power2.in" },
        0.1,
      )
      .to(out, { autoAlpha: 0, duration: 0.3, ease: "none" }, 0.42)
      .fromTo(inn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28, ease: "none" }, 0.34)
      .fromTo(
        inn.querySelector(".slide__ghost"),
        { autoAlpha: 0, y: 38 },
        { autoAlpha: 1, y: 0, duration: 0.9 },
        0.36,
      )
      .fromTo(
        inn.querySelectorAll(".slide__wash, .slide__plinth"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8 },
        0.36,
      )
      .fromTo(
        inn.querySelector(".slide__form"),
        { autoAlpha: 0, y: 46, clipPath: "inset(100% 0% 0% 0%)" },
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1,
          ease: "power3.out",
        },
        0.44,
      )
      .fromTo(
        inn.querySelector(".slide__figure"),
        { autoAlpha: 0, y: 70, scale: 1.05 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.05, ease: "power3.out" },
        0.66,
      )
      .fromTo(
        inn.querySelectorAll(".slide__tag"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
        0.98,
      )
      .fromTo(
        inn.querySelector(".pin"),
        { autoAlpha: 0, scale: 0.3 },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2.2)" },
        1.08,
      );

    if (lookRef.current) {
      tl.fromTo(
        lookRef.current,
        { y: 14, autoAlpha: 0.35 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" },
        0.4,
      );
    }

    busyRef.current = true;
    const t = window.setTimeout(() => {
      busyRef.current = false;
      startAuto();
    }, HOLD);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, gsap]);

  /* One-time setup: gsap, intro, controls, pins, pointer depth. */
  useEffect(() => {
    let cancelled = false;
    let ctx = null;
    let ro = null;
    let rt = null;
    const stage = stageRef.current;
    const root = rootRef.current;
    const track = trackRef.current;
    if (!stage || !root || !track) return;

    const playIntro = () => {
      if (introPlayed.current) return;
      introPlayed.current = true;
      const g = gsapRef.current;
      if (!g || prefersReducedMotion()) return;
      const active = track.children[indexRef.current];
      if (!active) return;
      ctx?.revert();
      ctx = g.context(() => {
        g.timeline({ defaults: { ease: "power4.out" } })
          .from(".eyebrow", { y: 22, autoAlpha: 0, duration: 0.9 })
          .from(".hero__title", { y: 44, autoAlpha: 0, duration: 1.1 }, "-=0.65")
          .from(".hero__lede", { y: 26, autoAlpha: 0, duration: 0.9 }, "-=0.75")
          .from(
            ".hero__cta > *",
            { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.12 },
            "-=0.6",
          )
          .from(".hero__look", { y: 20, autoAlpha: 0, duration: 0.9 }, "-=0.5")
          .from(".hero__stats", { y: 20, autoAlpha: 0, duration: 0.9 }, "-=0.5")
          .fromTo(
            ".hero__word",
            { xPercent: -8, autoAlpha: 0 },
            { xPercent: 0, autoAlpha: 1, duration: 2, ease: "power2.out" },
            0.15,
          )
          .fromTo(
            ".hero__grid",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 1.8 },
            0.3,
          )
          /* the stage builds itself: frame, form, then figure */
          .from(".hero__frame", { autoAlpha: 0, duration: 0.9 }, 0.35)
          .from(
            ".hero__gauge",
            { autoAlpha: 0, scaleY: 0, transformOrigin: "top center", duration: 0.9 },
            0.5,
          )
          .fromTo(
            active.querySelector(".slide__ghost"),
            { autoAlpha: 0, y: 44 },
            { autoAlpha: 1, y: 0, duration: 1 },
            0.45,
          )
          .fromTo(
            active.querySelectorAll(".slide__wash, .slide__plinth"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 1.2 },
            0.5,
          )
          .fromTo(
            active.querySelector(".slide__form"),
            { autoAlpha: 0, y: 48, clipPath: "inset(100% 0% 0% 0%)" },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: "power3.out",
            },
            0.55,
          )
          .fromTo(
            active.querySelector(".slide__figure"),
            { autoAlpha: 0, y: 76, scale: 1.06 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" },
            0.9,
          )
          .fromTo(
            active.querySelectorAll(".slide__tag"),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 },
            1.3,
          )
          .fromTo(
            active.querySelector(".pin"),
            { autoAlpha: 0, scale: 0.3 },
            { autoAlpha: 1, scale: 1, duration: 0.65, ease: "back.out(2.2)" },
            1.4,
          )
          .from(".hero__rail > *", { autoAlpha: 0, x: 16, duration: 0.7, stagger: 0.08 }, 0.85)
          .from(".hero__cue", { autoAlpha: 0, y: 14, duration: 0.7 }, 1.35);
      }, root);
      window.setTimeout(startAuto, 1750);
    };

    let revealed = document.documentElement.dataset.revealed === "1";
    const tryIntro = () => {
      if (revealed && gsapRef.current) playIntro();
    };
    const revealHandler = () => {
      revealed = true;
      tryIntro();
    };

    const onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = document.activeElement;
      if (el && /input|textarea/i.test(el.tagName)) return;
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      goTo(indexRef.current + (e.key === "ArrowRight" ? 1 : -1), true);
    };

    let sx = 0;
    let sy = 0;
    let tracking = false;
    const onPointerDown = (e) => {
      if (e.pointerType === "mouse") return;
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const onPointerUp = (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        goTo(indexRef.current + (dx < 0 ? 1 : -1), true);
      }
    };
    const pause = (on) => {
      pausedRef.current = on;
      if (on) stopAuto();
      else startAuto();
    };
    const onEnter = () => pause(true);
    const onLeave = () => pause(false);
    const onVisibility = () => pause(document.hidden);

    /* Pointer depth: the model drifts with the cursor, the dress form
       answers from the opposite side, and the look number floats farthest
       behind — three planes moving at different rates. */
    const depth = (i) => {
      const g = gsapRef.current;
      const slide = track.children[i];
      if (!g || !slide) return null;
      if (!depthRef.current) depthRef.current = new Map();
      if (!depthRef.current.has(i)) {
        const layer = (sel) => slide.querySelector(sel);
        const opts = { duration: 0.75, ease: "power3" };
        depthRef.current.set(i, {
          figure: g.quickTo(layer(".slide__layer--figure"), "x", opts),
          figureY: g.quickTo(layer(".slide__layer--figure"), "y", opts),
          form: g.quickTo(layer(".slide__layer--form"), "x", opts),
          formY: g.quickTo(layer(".slide__layer--form"), "y", opts),
          ghost: g.quickTo(layer(".slide__ghost"), "x", opts),
        });
      }
      return depthRef.current.get(i);
    };
    const onPointerMove = (e) => {
      const d = depth(indexRef.current);
      if (!d) return;
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      d.figure(nx * 12);
      d.figureY(ny * 7);
      d.form(nx * -24);
      d.formY(ny * -13);
      d.ghost(nx * 34);
    };
    const onPointerLeave = () => {
      const d = depth(indexRef.current);
      if (!d) return;
      d.figure(0);
      d.figureY(0);
      d.form(0);
      d.formY(0);
      d.ghost(0);
    };

    /* Hotspot cards open toward the middle of the stage, never past its
       right edge, so a pin near the frame flips its card to the left. */
    const alignPins = () => {
      const edge = stage.getBoundingClientRect().right;
      track.querySelectorAll(".pin").forEach((pin) => {
        const card = pin.querySelector(".pin__card");
        if (!card) return;
        const x = pin.getBoundingClientRect().left;
        pin.classList.toggle("is-flipped", x + card.offsetWidth + 28 > edge);
      });
    };

    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(alignPins, 140);
    };

    stage.addEventListener("mouseenter", onEnter);
    stage.addEventListener("mouseleave", onLeave);
    stage.addEventListener("focusin", onEnter);
    stage.addEventListener("focusout", onLeave);
    stage.addEventListener("pointerdown", onPointerDown, { passive: true });
    stage.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize, { passive: true });

    if (document.documentElement.dataset.revealed === "1") {
      revealed = true;
    } else {
      document.addEventListener("fash:revealed", revealHandler, { once: true });
    }
    alignPins();

    (async () => {
      try {
        const mod = await getGsap();
        if (cancelled) return;
        gsapRef.current = mod.gsap;
        /* Stack the slides: only the current look is on stage. */
        mod.gsap.set(Array.from(track.children), { autoAlpha: 0 });
        mod.gsap.set(track.children[indexRef.current], { autoAlpha: 1 });
        setGsap(mod.gsap);
        if (
          window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
          !prefersReducedMotion()
        ) {
          stage.addEventListener("pointermove", onPointerMove, { passive: true });
          stage.addEventListener("pointerleave", onPointerLeave);
        }
        if (window.ResizeObserver) {
          ro = new ResizeObserver(alignPins);
          ro.observe(stage);
        }
        tryIntro();
      } catch {
        /* no gsap — the carousel still swaps through CSS classes */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("fash:revealed", revealHandler);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      stage.removeEventListener("mouseenter", onEnter);
      stage.removeEventListener("mouseleave", onLeave);
      stage.removeEventListener("focusin", onEnter);
      stage.removeEventListener("focusout", onLeave);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      if (ro) ro.disconnect();
      if (autoRef.current) autoRef.current.kill();
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const look = HERO_SLIDES[index];

  return (
    <section className="hero" id="top" ref={rootRef}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__grid" />
        <div className="hero__spotlight" />
        <div className="hero__word">Heritage</div>
      </div>

      <div className="hero__copy">
        <p className="eyebrow">Festive 2025 Collection</p>
        <h1 className="hero__title">
          Woven From<br />
          <em>Heritage</em>
        </h1>
        <p className="hero__lede">
          FASH celebrates Nigeria&apos;s native dress tradition. Aso Oke, Ankara,
          Adire and lace, cut and finished by our Lagos tailors into statement
          pieces for weddings, galas and everyday pride.
        </p>
        <div className="hero__cta">
          <button
            className="btn btn--solid magnetic"
            type="button"
            onClick={() => scrollToTarget("#lookbook")}
          >
            <span>Explore Collection</span>
          </button>
          <a
            className="ulink magnetic"
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#shop");
            }}
          >
            Shop The Drop
          </a>
        </div>

        <p className="hero__look" ref={lookRef}>
          <span className="hero__look-tag">{`Look ${String(index + 1).padStart(2, "0")}`}</span>
          <span className="hero__look-title">{look.title}</span>
          <span className="hero__look-cap">{look.caption}</span>
          <span className="hero__look-swatch" style={{ "--swatch": look.tint }} />
        </p>

        <dl className="hero__stats">
          {HERO_STATS.map((s) => (
            <div key={s.dt}>
              <dt>{s.dt}</dt>
              <dd>
                <span data-count={s.value}>{s.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hero__stage" id="heroStage" ref={stageRef}>
        <div className="hero__frame" aria-hidden="true">
          <span className="hero__frame-tag">Form / Finish — Atelier, Lagos</span>
        </div>
        <div className="hero__gauge" aria-hidden="true">
          <span className="hero__gauge-ticks" />
          <span className="hero__gauge-marker" ref={gaugeRef} />
        </div>

        <div className="hero__slides" id="heroSlides" ref={trackRef}>
          {HERO_SLIDES.map((s, i) => (
            <article
              key={s.id}
              className={`slide${i === index ? " is-active" : ""}`}
              aria-roledescription="slide"
              aria-label={`Look ${i + 1} of ${total}: ${s.title}`}
              aria-hidden={i === index ? "false" : "true"}
            >
              <span className="slide__ghost" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="slide__wash" aria-hidden="true" style={{ "--tint": s.tint }} />
              <span className="slide__plinth" aria-hidden="true" />
              <span className="slide__tag slide__tag--figure">As worn</span>
              <span className="slide__tag slide__tag--form">Dress form</span>

              <div className="slide__layer slide__layer--form">
                <Image
                  className="slide__form"
                  src={s.formImg}
                  alt={s.formAlt}
                  width={s.formWidth}
                  height={s.formHeight}
                  sizes="(max-width: 1024px) 46vw, 26vw"
                  preload={i === 0}
                  quality={82}
                />
              </div>

              <div className="slide__layer slide__layer--figure">
                <Image
                  className="slide__figure"
                  src={s.img}
                  alt={s.alt}
                  width={s.width}
                  height={s.height}
                  sizes="(max-width: 1024px) 66vw, 36vw"
                  preload={i === 0}
                  quality={82}
                />
                <button
                  className="pin"
                  type="button"
                  style={{ "--x": s.pin.x, "--y": s.pin.y }}
                  aria-label={`View details: ${s.pin.name}, from ${naira(s.pin.price)}`}
                  tabIndex={i === index ? undefined : -1}
                  onClick={() => openQuickView(s.pin.productId)}
                >
                  <span className="pin__dot" aria-hidden="true" />
                  <span className="pin__card">
                    <strong>{s.pin.name}</strong>
                    <em>{s.pin.note}</em>
                    <span className="pin__price">{naira(s.pin.price)}</span>
                    <span className="pin__add">View piece</span>
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hero__rail">
          <p className="hero__count">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span className="hero__count-sep" aria-hidden="true" />
            <span className="hero__count-total">{String(total).padStart(2, "0")}</span>
          </p>
          <div className="hero__autoplay" aria-hidden="true">
            <span ref={fillRef} />
          </div>
          <div className="hero__dots" role="tablist" aria-label="Choose a look">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                className="dot"
                type="button"
                role="tab"
                aria-selected={i === index ? "true" : "false"}
                aria-label={`Show look ${i + 1}: ${s.title}`}
                onClick={() => goTo(i, true)}
              />
            ))}
          </div>
          <div className="hero__arrows">
            <button
              className="btn btn--outline btn--icon"
              type="button"
              aria-label="Previous look"
              onClick={() => goTo(index - 1, true)}
            >
              <Icon name="arrowLeft" />
            </button>
            <button
              className="btn btn--outline btn--icon"
              type="button"
              aria-label="Next look"
              onClick={() => goTo(index + 1, true)}
            >
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>
      </div>

      <p className="hero__cue" aria-hidden="true">
        <span>Scroll</span>
        <span className="hero__cue-line" />
      </p>

      <p className="sr-only" role="status" aria-live="polite" ref={statusRef} />
    </section>
  );
}
