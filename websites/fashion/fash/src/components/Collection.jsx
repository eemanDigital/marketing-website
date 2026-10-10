"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getGsap, prefersReducedMotion, scrollToTarget } from "@/lib/gsap";
import { useStore } from "@/components/StoreProvider";
import { PRODUCTS } from "@/lib/catalog";
import { naira } from "@/lib/format";

import "./Collection.css";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------
   Content — everything comes from the catalogue, so names, prices and
   photos always match the shop.
   ------------------------------------------------------------------ */
const byId = (id) => PRODUCTS.find((p) => p.id === id);

/* Pick named pieces first, then top up from the catalogue. */
const pick = (ids, n) => {
  const named = ids.map(byId).filter(Boolean);
  const rest = PRODUCTS.filter((p) => !named.includes(p));
  return [...named, ...rest].slice(0, n);
};

const HERO = pick(
  [
    "royal-blue-safari-suite",
    "cream-offwhite-embroidered-kaftan",
    "deep-burgundy-safari-suit",
  ],
  3,
);

const ARRIVALS = pick(
  ["mustard-yellow-safari-suite", "off-white-long-line-kaftan"],
  2,
);

/* Used when a product has no `colors` array of its own. */
const FALLBACK_SWATCHES = [
  "#d8c9b2",
  "#7b5d45",
  "#2b2724",
  "#c8b295",
  "#1f3350",
];
const swatchesOf = (p) =>
  Array.isArray(p.colors) && p.colors.length ? p.colors : FALLBACK_SWATCHES;

const CATS = [
  "All",
  ...Array.from(new Set(PRODUCTS.map((p) => p.cat).filter(Boolean))),
];

const BAND = [
  "Kaftans",
  "Safari Suits",
  "Tunic",
  "Shirts",
  "Trousers",
  "Jackets",
  "Blazers",
  "Accessories",
];

const WHY = [
  {
    title: "Premium Quality",
    text: "Finest fabrics for long-lasting comfort.",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </>
    ),
  },
  {
    title: "Modern Design",
    text: "Timeless style meets contemporary trends.",
    icon: (
      <>
        <path d="M12 7.5a2.2 2.2 0 1 1 2.2 2.2c-1.2.4-2.2 1-2.2 2.3V13" />
        <path d="M12 13 3.5 18.5h17z" />
      </>
    ),
  },
  {
    title: "Perfect Fit",
    text: "Made to measure, alterations included.",
    icon: <path d="M8 4 3 7l2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0z" />,
  },
  {
    title: "Easy Returns",
    text: "Hassle-free returns within 30 days.",
    icon: (
      <>
        <path d="M4 12a8 8 0 1 0 2.6-5.9" />
        <path d="M4 4v4h4" />
      </>
    ),
  },
];

const Star4 = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" />
  </svg>
);

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="cl-ico" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

const Bag = () => (
  <svg viewBox="0 0 24 24" className="cl-ico" aria-hidden="true">
    <path d="M5 8h14l-1 13H6z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </svg>
);

const Swatches = ({ colors }) => (
  <span className="cl-swatches" aria-hidden="true">
    {colors.map((c) => (
      <i key={c} style={{ background: c }} />
    ))}
  </span>
);

export default function Collection() {
  const { addItem, openPanel, openQuickView, saved } = useStore();

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cat, setCat] = useState("All");

  const rootRef = useRef(null);
  const gsapRef = useRef(null);
  const idxRef = useRef(0);
  const animRef = useRef(false);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);

  const items = useMemo(() => {
    if (cat === "Saved") return PRODUCTS.filter((p) => saved.includes(p.id));
    return cat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
  }, [cat, saved]);

  /* Deep links — /collection?cat=Kaftan and /collection?view=saved — plus
     the header's heart, which fires the event when we are already here. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const view = q.get("view");
    const c = q.get("cat");
    if (view === "saved") setCat("Saved");
    else if (c && CATS.includes(c)) setCat(c);
  }, []);

  useEffect(() => {
    const onSaved = () => setCat("Saved");
    const onFilter = (e) => {
      const f = e.detail;
      setCat(f && CATS.includes(f) ? f : "All");
    };
    window.addEventListener("fash:show-saved", onSaved);
    window.addEventListener("fash:filter", onFilter);
    return () => {
      window.removeEventListener("fash:show-saved", onSaved);
      window.removeEventListener("fash:filter", onFilter);
    };
  }, []);

  const look = HERO[idx];
  const nextLook = HERO[(idx + 1) % HERO.length];

  /* ================================================================
     HERO SLIDER
     Looks slide past each other; the info card fades through.
     ================================================================ */
  const goTo = useCallback((target, dir = 1) => {
    const n = (target + HERO.length) % HERO.length;
    if (n === idxRef.current || animRef.current) return;

    const root = rootRef.current;
    const gsap = gsapRef.current;
    const from = idxRef.current;
    idxRef.current = n;

    if (!gsap || !root || prefersReducedMotion()) {
      setIdx(n);
      return;
    }

    const slides = root.querySelectorAll(".cl-slide");
    const info = root.querySelector(".cl-card__swap");
    animRef.current = true;

    gsap.set(slides[n], { autoAlpha: 1, x: dir * 90, scale: 1.08, zIndex: 2 });
    gsap.set(slides[from], { zIndex: 1 });
    gsap.to(slides[from], {
      autoAlpha: 0,
      x: -dir * 60,
      duration: 0.9,
      ease: "power3.inOut",
    });
    gsap.to(slides[n], {
      x: 0,
      scale: 1,
      duration: 1.1,
      ease: "expo.out",
      onComplete: () => {
        animRef.current = false;
      },
    });

    if (info) {
      gsap.set(info, { autoAlpha: 0, y: 14 });
      setIdx(n);
      gsap.to(info, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        delay: 0.3,
        ease: "power3.out",
      });
    } else {
      setIdx(n);
    }
  }, []);

  /* Autoplay: pauses on the button, on hidden tabs, and for reduced motion. */
  useEffect(() => {
    if (!playing || prefersReducedMotion()) return;
    const id = setInterval(() => {
      if (!document.hidden) goTo(idxRef.current + 1, 1);
    }, 5600);
    return () => clearInterval(id);
  }, [playing, goTo]);

  /* ================================================================
     PAGE MOTION
     Armed only after GSAP loads (without it the page is just visible).
     The hero intro waits for the preloader. Photos are never hidden;
     a curtain slides off them instead.
     ================================================================ */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    let cancelled = false;
    let ctx = null;
    let io = null;
    let raf = 0;
    let safety = 0;
    let played = false;
    let onScroll = null;
    let onMove = null;
    let onEnter = null;
    let onLeave = null;
    let onRevealed = null;
    let band = null;

    getGsap()
      .then(({ gsap }) => {
        if (cancelled) return;
        gsapRef.current = gsap;
        root.classList.add("is-armed");

        ctx = gsap.context(() => {
          const ups = gsap.utils.toArray("[data-cl='up']");
          const curtains = gsap.utils
            .toArray("[data-curtain]")
            .filter((el) => !el.closest(".cl-hero"));
          const pars = gsap.utils.toArray("[data-par]");

          /* Slides: only the active one is visible. */
          const slides = gsap.utils.toArray(".cl-slide");
          slides.forEach((s, i) =>
            gsap.set(s, {
              autoAlpha: i === idxRef.current ? 1 : 0,
              x: 0,
              scale: 1,
            }),
          );

          /* ---- Hold states ---- */
          gsap.set(ups, { autoAlpha: 0, y: 36 });
          gsap.set(".cl-line > span", { yPercent: 112 });
          gsap.set(".cl-hero__reveal", { autoAlpha: 0, y: 22 });
          gsap.set(".cl-shape", { scaleY: 0, transformOrigin: "50% 100%" });
          gsap.set(".cl-star", { scale: 0, rotate: -90 });

          /* ---- Hero intro ---- */
          const play = () => {
            if (played) return;
            played = true;
            clearTimeout(safety);
            const heroFrame = root.querySelector(".cl-hero__frame");
            gsap
              .timeline({ defaults: { ease: "power3.out" } })
              .to(
                ".cl-line > span",
                { yPercent: 0, duration: 1.2, stagger: 0.12 },
                0.05,
              )
              .to(
                ".cl-shape",
                { scaleY: 1, duration: 1.3, ease: "expo.out" },
                0.1,
              )
              .fromTo(
                heroFrame,
                { "--c": 1 },
                {
                  "--c": 0,
                  duration: 1.4,
                  ease: "expo.inOut",
                  onComplete: () => heroFrame.classList.add("is-in"),
                },
                0.2,
              )
              .fromTo(
                ".cl-slide.is-first img",
                { scale: 1.35 },
                { scale: 1, duration: 2, ease: "expo.out" },
                0.2,
              )
              .to(
                ".cl-star",
                { scale: 1, rotate: 0, duration: 1, ease: "back.out(2)" },
                0.9,
              )
              .to(
                ".cl-hero__reveal",
                { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1 },
                0.7,
              );

            /* Idle life: the star turns, the scribble drifts. */
            gsap.to(".cl-star", {
              rotate: 360,
              duration: 18,
              ease: "none",
              repeat: -1,
              delay: 2,
            });
            gsap.to(".cl-scribble", {
              y: -8,
              x: 6,
              duration: 3.2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          };

          onRevealed = () => play();
          if (document.documentElement.dataset.revealed === "1") play();
          else {
            document.addEventListener("fash:revealed", onRevealed, {
              once: true,
            });
            safety = window.setTimeout(play, 7000);
          }

          /* ---- Mouse parallax on the hero (fine pointers only) ---- */
          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            const fx = gsap.quickTo(".cl-hero__frame", "x", {
              duration: 0.9,
              ease: "power3",
            });
            const fy = gsap.quickTo(".cl-hero__frame", "y", {
              duration: 0.9,
              ease: "power3",
            });
            const sx = gsap.quickTo(".cl-shape", "x", {
              duration: 1.2,
              ease: "power3",
            });
            onMove = (e) => {
              const px = e.clientX / window.innerWidth - 0.5;
              const py = e.clientY / window.innerHeight - 0.5;
              fx(px * -14);
              fy(py * -10);
              sx(px * 22);
            };
            window.addEventListener("pointermove", onMove);
          }

          /* ---- Band: endless drift, slows on hover ---- */
          const track = root.querySelector(".cl-band__track");
          band = root.querySelector(".cl-band");
          if (track && band) {
            const drift = gsap.to(track, {
              xPercent: -50,
              duration: 34,
              ease: "none",
              repeat: -1,
            });
            onEnter = () =>
              gsap.to(drift, {
                timeScale: 0.2,
                duration: 0.6,
                overwrite: true,
              });
            onLeave = () =>
              gsap.to(drift, { timeScale: 1, duration: 0.6, overwrite: true });
            band.addEventListener("mouseenter", onEnter);
            band.addEventListener("mouseleave", onLeave);
          }

          /* ---- Rotating badge ---- */
          gsap.to(".cl-badge__ring", {
            rotation: 360,
            duration: 18,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          });
          gsap.to(".cl-badge .cl-star-sm", {
            scale: 1.18,
            duration: 1.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            transformOrigin: "50% 50%",
          });

          /* ---- Scroll reveals ---- */
          io = new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const el = e.target;
                io.unobserve(el);
                const d = Number(el.dataset.d || 0);

                if (el.dataset.curtain) {
                  gsap.fromTo(
                    el,
                    { "--c": 1 },
                    {
                      "--c": 0,
                      duration: 1.3,
                      delay: d,
                      ease: "expo.inOut",
                      onComplete: () => el.classList.add("is-in"),
                    },
                  );
                  const img = el.querySelector("img");
                  if (img && !img.classList.contains("cl-fit")) {
                    gsap.fromTo(
                      img,
                      { scale: 1.45 },
                      { scale: 1.2, duration: 1.9, delay: d, ease: "expo.out" },
                    );
                  }
                } else {
                  gsap.to(el, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.9,
                    delay: d,
                    ease: "power3.out",
                  });
                }
              });
            },
            { threshold: 0, rootMargin: "0px 0px -8% 0px" },
          );
          [...ups, ...curtains].forEach((el) => io.observe(el));

          /* ---- Scroll parallax (bounded by the 20% overscan) ---- */
          const setters = pars
            .map((el) => {
              const img = el.querySelector("img");
              if (!img) return null;
              return {
                el,
                pct: (Number(el.dataset.par) || 6) / 100,
                set: gsap.quickSetter(img, "y", "px"),
              };
            })
            .filter(Boolean);

          const update = () => {
            raf = 0;
            const vh = window.innerHeight;
            setters.forEach(({ el, pct, set }) => {
              const r = el.getBoundingClientRect();
              if (r.bottom < -120 || r.top > vh + 120) return;
              const p = gsap.utils.clamp(
                -1,
                1,
                (r.top + r.height / 2 - vh / 2) / vh,
              );
              set(-p * r.height * pct);
            });
          };
          onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
          update();
        }, root);
      })
      .catch(() => {
        /* no gsap: the page is already fully visible */
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      if (io) io.disconnect();
      if (onScroll) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (band && onEnter) band.removeEventListener("mouseenter", onEnter);
      if (band && onLeave) band.removeEventListener("mouseleave", onLeave);
      if (onRevealed) document.removeEventListener("fash:revealed", onRevealed);
      if (ctx) ctx.revert();
      root.classList.remove("is-armed");
      root
        .querySelectorAll(".is-in")
        .forEach((el) => el.classList.remove("is-in"));
    };
  }, []);

  /* ================================================================
     FILTER SWAP — old cards lift away, new ones rise in (no flash).
     ================================================================ */
  const changeCat = useCallback(
    (next) => {
      if (next === cat || busyRef.current) return;
      const gsap = gsapRef.current;
      const cards = rootRef.current?.querySelectorAll(".cl-prod");
      if (!gsap || prefersReducedMotion() || !cards || !cards.length) {
        setCat(next);
        return;
      }
      busyRef.current = true;
      gsap.to(cards, {
        autoAlpha: 0,
        y: -18,
        scale: 0.97,
        duration: 0.28,
        stagger: 0.03,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          setCat(next);
          busyRef.current = false;
        },
      });
    },
    [cat],
  );

  useIso(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const gsap = gsapRef.current;
    const cards = rootRef.current?.querySelectorAll(".cl-prod");
    if (!gsap || prefersReducedMotion() || !cards || !cards.length) return;
    gsap.set(cards, { autoAlpha: 0, y: 40, scale: 0.96 });
    gsap.to(cards, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.07,
      ease: "power3.out",
      overwrite: true,
    });
  }, [cat]);

  /* ---------------- Actions ---------------- */
  const bump = (el) => {
    const gsap = gsapRef.current;
    if (!gsap || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { scale: 0.9 },
      { scale: 1, duration: 0.6, ease: "back.out(3)" },
    );
  };

  const add = (e, p) => {
    bump(e.currentTarget);
    addItem(p);
  };

  const buy = (e, p) => {
    bump(e.currentTarget);
    addItem(p);
    openPanel("cart");
  };

  const go = (e, sel) => {
    e.preventDefault();
    scrollToTarget(sel);
  };

  return (
    <div className="cl" ref={rootRef}>
      {/* ============ HERO ============ */}
      <section className="cl-hero">
        <div className="cl-wrap cl-hero__inner">
          <div className="cl-hero__copy">
            <h1 className="cl-title">
              <span className="sr-only">
                Wear your style, own your confidence
              </span>
              <span className="cl-line cl-title__sm" aria-hidden="true">
                <span>
                  Wear <em>your</em>
                </span>
              </span>
              <span className="cl-line cl-title__lg" aria-hidden="true">
                <span>Style</span>
              </span>
              <span className="cl-line cl-title__sm" aria-hidden="true">
                <span>
                  Own <em>your</em>
                </span>
              </span>
              <span className="cl-line cl-title__md" aria-hidden="true">
                <span>Confidence</span>
              </span>
            </h1>

            <p className="cl-hero__p cl-hero__reveal">
              Premium quality clothing crafted for comfort, designed for the
              modern man.
            </p>

            <a
              className="cl-btn cl-btn--dark cl-hero__reveal"
              href="#cl-grid"
              onClick={(e) => go(e, "#cl-grid")}>
              Shop Now <Arrow />
            </a>

            <div className="cl-trust cl-hero__reveal">
              <div className="cl-trust__faces" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <p>
                Trusted by <b>10K+</b>
                <br />
                Happy Customers
              </p>
            </div>
          </div>

          <div className="cl-hero__media">
            <div className="cl-shape" aria-hidden="true" />
            <Star4 className="cl-star" />
            <svg
              className="cl-scribble"
              viewBox="0 0 220 90"
              aria-hidden="true">
              <path d="M4 70C40 20 120 10 150 40C175 66 120 82 100 60C80 36 150 18 214 28" />
            </svg>

            <div className="cl-hero__frame" data-curtain="x">
              {HERO.map((p, i) => (
                <figure
                  key={p.id}
                  className={`cl-slide${i === 0 ? " is-first" : ""}${
                    i === idx ? " is-active" : ""
                  }`}
                  aria-hidden={i === idx ? undefined : "true"}>
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    priority={i === 0}
                    loading="eager"
                    sizes="(max-width: 900px) 90vw, 36vw"
                  />
                </figure>
              ))}
            </div>
          </div>

          <aside className="cl-hero__side">
            <button
              type="button"
              className="cl-pill cl-hero__reveal"
              aria-label={`Next look: ${nextLook.name}`}
              onClick={() => goTo(idxRef.current + 1, 1)}>
              <Image
                src={nextLook.img}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 900px) 40vw, 14vw"
              />
            </button>

            <div className="cl-card cl-hero__reveal">
              <div className="cl-card__swap">
                <small>New Arrival</small>
                <h2>{look.name}</h2>
                <b>{naira(look.price)}</b>
              </div>
              <a
                className="cl-link"
                href="#cl-grid"
                onClick={(e) => go(e, "#cl-grid")}>
                Explore the Collection <Arrow />
              </a>
            </div>

            <div
              className="cl-ctrl cl-hero__reveal"
              role="group"
              aria-label="Hero looks">
              <button
                type="button"
                aria-label="Previous look"
                onClick={() => goTo(idxRef.current - 1, -1)}>
                <svg viewBox="0 0 24 24" className="cl-ico" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                aria-pressed={!playing}
                onClick={() => setPlaying((v) => !v)}>
                <svg viewBox="0 0 24 24" className="cl-ico" aria-hidden="true">
                  {playing ? (
                    <path d="M9 6v12M15 6v12" />
                  ) : (
                    <path d="M8 5l11 7-11 7z" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next look"
                onClick={() => goTo(idxRef.current + 1, 1)}>
                <svg viewBox="0 0 24 24" className="cl-ico" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <span className="cl-ctrl__n" aria-live="polite">
                {String(idx + 1).padStart(2, "0")}/
                {String(HERO.length).padStart(2, "0")}
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ BAND ============ */}
      <div className="cl-band-wrap" aria-hidden="true">
        <div className="cl-band">
          <div className="cl-band__track">
            {[0, 1, 2, 3].map((g) => (
              <div className="cl-band__group" key={g}>
                {BAND.map((t) => (
                  <span key={`${g}-${t}`}>
                    {t}
                    <i />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="cl-wrap cl-arr">
        <div className="cl-arr__copy" data-cl="up">
          <small className="cl-eyebrow">New Arrivals</small>
          <h2>
            Fresh Styles
            <br />
            For Every You
          </h2>
          <p>
            Discover the latest trends and timeless basics, all cut and finished
            in our Lagos atelier.
          </p>
          <a
            className="cl-link"
            href="#cl-grid"
            onClick={(e) => go(e, "#cl-grid")}>
            View All Collection <Arrow />
          </a>

          <div className="cl-badge" aria-hidden="true">
            <svg className="cl-badge__ring" viewBox="0 0 120 120">
              <defs>
                <path
                  id="clBadgePath"
                  d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
                />
              </defs>
              <text>
                <textPath href="#clBadgePath">
                  QUALITY • STYLE • COMFORT • STYLE •
                </textPath>
              </text>
            </svg>
            <Star4 className="cl-star-sm" />
          </div>
        </div>

        <div className="cl-arr__big" data-curtain="y" data-par="7">
          <Image
            className="cl-fit"
            src={ARRIVALS[0].img}
            alt={ARRIVALS[0].alt}
            fill
            loading="eager"
            sizes="(max-width: 700px) 90vw, 36vw"
          />
          <button
            type="button"
            className="cl-bagbtn"
            aria-label={`Add ${ARRIVALS[0].name} to bag`}
            onClick={(e) => add(e, ARRIVALS[0])}>
            <Bag />
          </button>
        </div>

        <article className="cl-arr__card" data-curtain="y" data-d="0.15">
          <div className="cl-arr__card-img" data-par="6">
            <Image
              className="cl-fit"
              src={ARRIVALS[1].img}
              alt={ARRIVALS[1].alt}
              fill
              loading="eager"
              sizes="(max-width: 900px) 90vw, 26vw"
            />
          </div>
          <div className="cl-arr__card-body">
            <h3>{ARRIVALS[1].name}</h3>
            <b>{naira(ARRIVALS[1].price)}</b>
            <p>Available in {swatchesOf(ARRIVALS[1]).length} Colors</p>
            <Swatches colors={swatchesOf(ARRIVALS[1])} />
            <div className="cl-arr__card-foot">
              <button
                type="button"
                className="cl-shopnow"
                onClick={(e) => buy(e, ARRIVALS[1])}>
                Shop Now
                <span aria-hidden="true">
                  <Arrow />
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* ============ THE COLLECTION ============ */}
      <section className="cl-wrap cl-grid" id="cl-grid">
        <div className="cl-grid__head" data-cl="up">
          <div>
            <small className="cl-eyebrow">The Collection</small>
            <h2>
              Every Piece,
              <br />
              Made For You
            </h2>
          </div>
          <p className="cl-count" aria-live="polite">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <div
          className="cl-chips"
          role="group"
          aria-label="Filter collection"
          data-cl="up"
          data-d="0.08">
          {(cat === "Saved" ? [...CATS, "Saved"] : CATS).map((c) => (
            <button
              key={c}
              type="button"
              className="cl-chip"
              aria-pressed={c === cat}
              onClick={() => changeCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="cl-products" data-cl="up" data-d="0.12">
          {items.map((p) => (
            <article className="cl-prod" key={p.id}>
              <div className="cl-prod__media">
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 24vw"
                />
                {p.badge && <span className="cl-tag">{p.badge}</span>}
                <button
                  type="button"
                  className="cl-view"
                  aria-label={`Quick view ${p.name}`}
                  onClick={() => openQuickView(p.id)}
                />
                <button
                  type="button"
                  className="cl-quick"
                  onClick={(e) => add(e, p)}>
                  <Bag /> Add to Bag
                </button>
              </div>
              <div className="cl-prod__row">
                <h3>{p.name}</h3>
                <b>{naira(p.price)}</b>
              </div>
              <Swatches colors={swatchesOf(p)} />
            </article>
          ))}
        </div>
        {items.length === 0 && (
          <p className="cl-empty">
            {cat === "Saved"
              ? "Nothing saved yet — open a piece and tap the heart to keep it here."
              : "Nothing here yet."}
          </p>
        )}
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="cl-wrap cl-why">
        <small className="cl-eyebrow" data-cl="up">
          Why Choose Us
        </small>
        <h2 data-cl="up" data-d="0.06">
          Crafted For Quality.
          <br />
          Made For You.
        </h2>

        <div className="cl-why__grid">
          {WHY.map((w, i) => (
            <div
              className="cl-why__item"
              key={w.title}
              data-cl="up"
              data-d={0.08 * i}>
              <span className="cl-why__ico" aria-hidden="true">
                <svg viewBox="0 0 24 24">{w.icon}</svg>
              </span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
