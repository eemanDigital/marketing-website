"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getGsap, prefersReducedMotion } from "@/lib/gsap";
import { useStore } from "@/components/StoreProvider";
import { PRODUCTS } from "@/lib/catalog";
import { naira } from "@/lib/format";

/* Featured pieces — the standard collection PNGs, so the fan holds
   exactly 7 real products (1 centre, 3 left, 3 right, no repeats).
   Names, badges and prices are pulled from the catalogue. */
const FEATURED_SRCS = [
  "/images/royal-blue-safari-suite.png",
  "/images/deep-burgundy-safari-suit-short.png",
  "/images/mustard-yellow-safari-suite-short.png",
  "/images/dark-grey-safari-suite-short-sleeve.png",
  "/images/off-white-long-line-kaftan-long.png",
  "/images/cream-offwhite-embroidered-kaftan-short.png",
  "/images/medium-grey-high-collar-pattern.png",
];

const ITEMS = FEATURED_SRCS.map((src) => PRODUCTS.find((p) => p.img === src))
  .filter(Boolean)
  .map((p) => ({
    id: p.id,
    src: p.img,
    name: p.name,
    tag: p.badge || "Featured",
    price: naira(p.price),
  }));

/* Fan geometry. Index 0 is the centre card, 1 to 3 are the cards at
   increasing distance. Widths are relative units; heights are a share
   of the stage height. */
const WIDTHS = [3.6, 1.2, 0.95, 1.0];
const HEIGHTS = [1, 0.94, 0.78, 0.62];
const MAX_OFFSET = 3;

/* Pure layout: x / width / height / opacity for every offset. */
function buildLayout(W, H) {
  const gap = W < 560 ? 3 : 6;
  const unit = (W - gap * 6) / (WIDTHS[0] + 2 * (WIDTHS[1] + WIDTHS[2] + WIDTHS[3]));
  const w = WIDTHS.map((v) => v * unit);

  const pos = {};
  const cx = (W - w[0]) / 2;
  pos[0] = { x: cx, w: w[0] };

  let r = cx + w[0] + gap;
  for (let k = 1; k <= MAX_OFFSET; k++) {
    pos[k] = { x: r, w: w[k] };
    r += w[k] + gap;
  }
  let l = cx - gap;
  for (let k = 1; k <= MAX_OFFSET; k++) {
    l -= w[k];
    pos[-k] = { x: l, w: w[k] };
    l -= gap;
  }

  const target = (o) => {
    const a = Math.abs(o);
    if (a <= MAX_OFFSET) {
      const h = H * HEIGHTS[a];
      return { x: pos[o].x, w: pos[o].w, h, y: (H - h) / 2, opacity: 1 };
    }
    /* Parked off-stage, invisible. */
    const h = H * 0.5;
    return {
      x: o < 0 ? -w[3] - 60 : W + 60,
      w: w[3],
      h,
      y: (H - h) / 2,
      opacity: 0,
    };
  };

  return { target, centre: { x: cx, w: w[0] } };
}

export default function FeaturedCollection({ onAdd, onOpen }) {
  const { addItem, openQuickView } = useStore();
  const add = onAdd || addItem;
  const open = onOpen || openQuickView;

  const list = useMemo(() => {
    const n = Math.max(7, ITEMS.length);
    return Array.from({ length: n }, (_, i) => ITEMS[i % ITEMS.length]);
  }, []);
  const n = list.length;
  const half = Math.floor(n / 2);

  const [active, setActive] = useState(0);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const activeRef = useRef(0);
  const prevOffRef = useRef([]);
  const gsapRef = useRef(null);
  const readyRef = useRef(false);
  const introRef = useRef(false);
  const swipeRef = useRef(null);

  const offsetOf = useCallback(
    (i, act) => ((((i - act + half) % n) + n) % n) - half,
    [n, half]
  );

  /* Position every card for the current selection. `mode` is one of
     "set" (no tween), "move" (animated) or "intro" (fan out). */
  const apply = useCallback(
    (mode) => {
      const stage = stageRef.current;
      if (!stage) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const { target, centre } = buildLayout(W, H);
      const act = activeRef.current;
      const cards = cardRefs.current;
      const lib = gsapRef.current;
      const animate = lib && mode !== "set" && !prefersReducedMotion();

      /* Fast path: plain inline styles (no GSAP / reduced motion). */
      if (!animate) {
        cards.forEach((el, i) => {
          if (!el) return;
          const o = offsetOf(i, act);
          const t = target(o);
          if (lib) {
            lib.gsap.set(el, { x: t.x, y: t.y, width: t.w, height: t.h, opacity: t.opacity });
          } else {
            el.style.width = `${t.w}px`;
            el.style.height = `${t.h}px`;
            el.style.opacity = String(t.opacity);
            el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
          }
          prevOffRef.current[i] = o;
        });
        syncInfo(false);
        return;
      }

      const { gsap } = lib;
      const intro = mode === "intro";

      cards.forEach((el, i) => {
        if (!el) return;
        const o = offsetOf(i, act);
        const prev = prevOffRef.current[i];
        const t = target(o);
        const wrapped = prev !== undefined && Math.abs(o - prev) > half;
        const vars = {
          x: t.x,
          y: t.y,
          width: t.w,
          height: t.h,
          opacity: t.opacity,
          duration: intro ? 1.6 : 1,
          ease: intro ? "expo.out" : "expo.inOut",
          delay: intro ? Math.abs(o) * 0.11 : Math.abs(o) * 0.025,
          overwrite: true,
        };

        if (intro) {
          /* Start folded into the middle of the stage. */
          gsap.set(el, {
            x: centre.x + centre.w / 2 - 8,
            y: H * 0.25,
            width: 16,
            height: H * 0.5,
            opacity: 0,
          });
          gsap.to(el, vars);
        } else if (wrapped) {
          /* Leaves on one side, slips in on the other. */
          const side = o < 0 ? -1 : 1;
          const t0 = target(side * (MAX_OFFSET + 1));
          gsap
            .timeline({ overwrite: true })
            .to(el, { opacity: 0, duration: 0.25, ease: "power2.out" })
            .set(el, { x: t0.x, y: t0.y, width: t0.w, height: t0.h })
            .to(el, { ...vars, delay: 0, duration: 0.85, overwrite: false });
        } else {
          gsap.to(el, vars);
        }
        prevOffRef.current[i] = o;
      });

      syncInfo(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offsetOf, half]
  );

  /* Info overlay + bag button follow the selected card. */
  const syncInfo = (animate) => {
    const lib = gsapRef.current;
    const root = rootRef.current;
    if (!root) return;
    const act = activeRef.current;

    root.querySelectorAll(".fc__info").forEach((el) => {
      const on = Number(el.dataset.i) === act;
      if (lib && animate && !prefersReducedMotion()) {
        lib.gsap.to(el, {
          autoAlpha: on ? 1 : 0,
          y: on ? 0 : 14,
          duration: on ? 0.7 : 0.25,
          delay: on ? 0.55 : 0,
          ease: "power3.out",
          overwrite: true,
        });
      } else {
        el.style.opacity = on ? "1" : "0";
        el.style.visibility = on ? "visible" : "hidden";
      }
    });

    if (lib && animate && !prefersReducedMotion()) {
      const img = cardRefs.current[act]?.querySelector("img");
      if (img) {
        lib.gsap.fromTo(
          img,
          { scale: 1.18 },
          { scale: 1, duration: 1.5, ease: "power3.out", overwrite: true }
        );
      }
      lib.gsap.fromTo(
        ".fc__bag",
        { scale: 0.55, rotate: -40 },
        { scale: 1, rotate: 0, duration: 0.8, delay: 0.35, ease: "back.out(2.2)" }
      );
    }
  };

  const select = useCallback(
    (i) => {
      const next = ((i % n) + n) % n;
      if (next === activeRef.current) return;
      activeRef.current = next;
      setActive(next);
      if (readyRef.current) apply("move");
    },
    [apply, n]
  );

  /* Mount: measure, place, then play the intro when scrolled into view. */
  useEffect(() => {
    const stage = stageRef.current;
    const root = rootRef.current;
    if (!stage || !root) return;

    let cancelled = false;
    let io = null;
    let ctx = null;

    apply("set");
    stage.classList.add("is-ready");
    readyRef.current = true;

    getGsap()
      .then((lib) => {
        if (cancelled) return;
        gsapRef.current = lib;
        apply("set"); /* hand the inline styles over to GSAP */

        if (prefersReducedMotion()) return;

        const run = () => {
          if (introRef.current) return;
          introRef.current = true;
          ctx = lib.gsap.context(() => {
            lib.gsap.from(".fc__title-line > span", {
              yPercent: 115,
              duration: 1,
              stagger: 0.12,
              ease: "power3.out",
            });
          }, root);
          apply("intro");
        };

        /* Hold the cards folded until the section is on screen. */
        const { gsap } = lib;
        gsap.set(".fc__card", { opacity: 0 });
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              run();
              io.disconnect();
            }
          },
          { threshold: 0.3 }
        );
        io.observe(stage);
      })
      .catch(() => {
        /* no gsap: the fan is already laid out and usable */
      });

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply("set"));
    });
    ro.observe(stage);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (io) io.disconnect();
      if (ctx) ctx.revert();
      if (gsapRef.current) gsapRef.current.gsap.killTweensOf(cardRefs.current);
    };
  }, [apply]);

  const onKey = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      select(activeRef.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      select(activeRef.current - 1);
    }
  };

  const onPointerDown = (e) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      select(activeRef.current + (dx < 0 ? 1 : -1));
    }
  };

  const current = list[active];

  return (
    <section className="fc" id="featured" ref={rootRef} aria-labelledby="fc-title">
      <div className="fc__panel">
        <h2 className="fc__title" id="fc-title">
          <span className="fc__title-line">
            <span>Featured Pieces</span>
          </span>
        </h2>

        <div
          className="fc__stage"
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured pieces"
          onKeyDown={onKey}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {list.map((item, i) => {
            const o = offsetOf(i, active);
            const isActive = i === active;
            const visible = Math.abs(o) <= MAX_OFFSET;
            return (
              <button
                key={`${item.src}-${i}`}
                type="button"
                className={`fc__card${isActive ? " is-active" : ""}`}
                ref={(el) => (cardRefs.current[i] = el)}
                aria-label={`${item.name}${isActive ? ", selected" : ""}`}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={visible ? undefined : "true"}
                tabIndex={visible ? 0 : -1}
                onClick={() => (isActive ? open(item.id) : select(i))}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 42vw, 32vw"
                  priority={i < 3}
                  draggable={false}
                />

                <span className="fc__info" data-i={i}>
                  <span className="fc__tag">{item.tag}</span>
                  <span className="fc__vert">
                    <small>Collection</small>
                    <b>{item.name}</b>
                  </span>
                  <span className="fc__price">
                    <small>Starting from</small>
                    <b>{item.price}</b>
                  </span>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="fc__bag"
            aria-label={`Add ${current.name} to bag`}
            onClick={() => add(current)}
          >
            <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
              <path d="M5 8h14l-1 13H6z" />
              <path d="M9 8a3 3 0 016 0" />
            </svg>
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {`Showing ${current.name}, ${active + 1} of ${n}`}
      </p>
    </section>
  );
}