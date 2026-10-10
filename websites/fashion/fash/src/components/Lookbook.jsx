"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
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

import "./Lookbook.css";

/* useLayoutEffect on the client, useEffect during SSR (no warning). */
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------
   Content. Every image lives in /public/images.
   ------------------------------------------------------------------ */
const IMG = {
  hero: "/images/charcoal-kaftan-long-sleeve.jpg",
  tileA: "/images/offwhite-long-sleeve.jpg",
  tileB: "/images/grey-long-kaftan-elegan-embroidery.jpg",
  promoA: "/images/butter-cream-dark-brown-long-safari-suit.jpg",
  promoB: "/images/creame-offwite-kaftan-long-sleeve.jpg",
  feature: "/images/muster-yellow-short-sleeve-safari-suit.jpg",
};

/* If the feature photo ever 404s, fall back to a catalogue image that
   is guaranteed to exist, so the panel is never an empty dark box. */
const FEATURE_FALLBACK =
  PRODUCTS.find((p) => p.cat === "Safari Suit")?.img ?? IMG.hero;

const CATS = ["Kaftan", "Safari Suit", "Tunic", "New In", "On Sale"];

const SHOW = [
  "royal-blue-safari-suite",
  "cream-offwhite-embroidered-kaftan",
  "deep-burgundy-safari-suit",
  "mustard-yellow-safari-suite",
  "off-white-long-line-kaftan",
  "medium-grey-high-collar",
  "aso-oke-set",
  "dark-grey-safari-suite",
  "embroidered-agbada",
  "lace-occasion-gown",
];

const COLLECTION = SHOW.map((id) => PRODUCTS.find((p) => p.id === id))
  .filter(Boolean)
  .map((p) => ({
    ...p,
    priceLabel: naira(p.price),
    cats: [
      p.cat,
      p.badge === "New" ? "New In" : null,
      p.badge === "Sale" ? "On Sale" : null,
    ].filter(Boolean),
  }));

const MARQUEE = [
  "FASH",
  "Kaftans & Safari Suits",
  "Hand-Finished in Lagos",
  "Alterations Included",
  "FASH",
];

const Star = () => (
  <svg className="lb-star" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" />
  </svg>
);

export default function Lookbook({ onAdd, onBuy }) {
  const { addItem, openPanel } = useStore();
  const router = useRouter();
  const [cat, setCat] = useState(CATS[0]);
  const [featureSrc, setFeatureSrc] = useState(IMG.feature);

  const rootRef = useRef(null);
  const gsapRef = useRef(null);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);

  const items = useMemo(
    () => COLLECTION.filter((p) => p.cats.includes(cat)),
    [cat],
  );

  /* ================================================================
     PAGE MOTION
     - Everything is "armed" only after GSAP has loaded, so if GSAP or
       JS fails the page is simply fully visible.
     - The hero intro waits for the preloader (fash:revealed) so it is
       actually seen instead of playing underneath it.
     - Photos are never hidden with clip-path; a curtain slides off
       them instead, so lazy-loading and IntersectionObserver always
       see the real image.
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
          const ups = gsap.utils.toArray("[data-lb='up']");
          const curtains = gsap.utils
            .toArray("[data-curtain]")
            .filter((el) => !el.closest(".lb-hero"));
          const pars = gsap.utils.toArray("[data-par]");
          const heroMedia = root.querySelector(".lb-hero__media");

          /* ---- Hold states ---- */
          gsap.set(ups, { autoAlpha: 0, y: 36 });
          gsap.set(".lb-parallax", { scale: 1.2 });
          gsap.set(".lb-hero__tag", { autoAlpha: 0, y: -14 });
          gsap.set(".lb-hero__line > span", { yPercent: 112 });
          gsap.set(".lb-hero__copy > *", { autoAlpha: 0, y: 20 });

          /* ---- Hero intro (fires once the preloader hands over) ---- */
          const playHero = () => {
            if (played) return;
            played = true;
            clearTimeout(safety);
            gsap
              .timeline({ defaults: { ease: "power3.out" } })
              .to(".lb-hero__tag", { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
              .to(
                ".lb-hero__line > span",
                { yPercent: 0, duration: 1.2, stagger: 0.14 },
                0.1,
              )
              .fromTo(
                heroMedia,
                { "--c": 1 },
                {
                  "--c": 0,
                  duration: 1.5,
                  ease: "expo.inOut",
                  onComplete: () => heroMedia.classList.add("is-in"),
                },
                0,
              )
              .fromTo(
                ".lb-hero__media .lb-parallax",
                { scale: 1.45 },
                { scale: 1.2, duration: 2.1, ease: "expo.out" },
                0,
              )
              .to(
                ".lb-hero__copy > *",
                { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1 },
                0.85,
              );
          };

          onRevealed = () => playHero();
          if (document.documentElement.dataset.revealed === "1") playHero();
          else {
            document.addEventListener("fash:revealed", onRevealed, {
              once: true,
            });
            /* Safety net: never leave the hero hidden. */
            safety = window.setTimeout(playHero, 7000);
          }

          /* ---- Marquee: endless drift, slows on hover ---- */
          const track = root.querySelector(".lb-marquee__track");
          band = root.querySelector(".lb-marquee");
          if (track && band) {
            const drift = gsap.to(track, {
              xPercent: -50,
              duration: 30,
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

          /* ---- Scroll reveals (IntersectionObserver) ---- */
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
                  if (img) {
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

          /* ---- Parallax: bounded by the 20% overscan, so no gaps ---- */
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
     FILTER SWAP
     Old cards lift away, then the new set rises in. The enter step
     runs in a layout effect, so the new cards never flash on screen.
     ================================================================ */
  const changeCat = useCallback(
    (next) => {
      if (next === cat || busyRef.current) return;
      const root = rootRef.current;
      const gsap = gsapRef.current;
      const cards = root?.querySelectorAll(".lb-prod");

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
        stagger: 0.035,
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
    const cards = rootRef.current?.querySelectorAll(".lb-prod");
    if (!gsap || prefersReducedMotion() || !cards || !cards.length) return;
    gsap.set(cards, { autoAlpha: 0, y: 40, scale: 0.96 });
    gsap.to(cards, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
      overwrite: true,
    });
  }, [cat]);

  /* Small spring on the cart / buy buttons. */
  const bump = (e) => {
    const gsap = gsapRef.current;
    if (!gsap || prefersReducedMotion()) return;
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.92 },
      { scale: 1, duration: 0.6, ease: "back.out(3)" },
    );
  };

  const goEdit = (e) => {
    e.preventDefault();
    scrollToTarget("#lb-edit");
  };

  const goShop = (e) => {
    e.preventDefault();
    router.push("/collection");
  };

  const add = (e, p) => {
    bump(e);
    if (onAdd) onAdd(p);
    else addItem(p);
  };

  const buy = (e, p) => {
    bump(e);
    if (onBuy) onBuy(p);
    else {
      addItem(p);
      openPanel("cart");
    }
  };

  return (
    <div className="lb" id="lookbook" ref={rootRef}>
      {/* ============ HERO ============ */}
      <section className="lb-hero">
        <div className="lb-wrap lb-hero__inner">
          <div className="lb-hero__media" data-curtain="x" data-par="6">
            <Image
              className="lb-parallax"
              src={IMG.hero}
              alt="Charcoal long-sleeve kaftan with tonal chest embroidery"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
            />
          </div>

          <div className="lb-hero__text">
            <span className="lb-hero__tag">Festive 2026 — Lagos</span>
            <h1 className="sr-only">FASH Lookbook</h1>
            <div className="lb-hero__line lb-display" aria-hidden="true">
              <span>FASH</span>
            </div>

            <div className="lb-hero__notch">
              <div className="lb-hero__line lb-display" aria-hidden="true">
                <span>Lookbook</span>
              </div>
              <div className="lb-hero__copy">
                <p>
                  Kaftans and safari suits, cut and finished in our Lagos
                  atelier. Every look in this book is a real piece in the shop —
                  made to measure, alterations included, ready when you are.
                </p>
                <div className="lb-hero__cta">
                  <a
                    className="lb-btn lb-btn--solid"
                    href="/collection"
                    onClick={goShop}>
                    Shop the Edit
                  </a>
                  <a
                    className="lb-btn lb-btn--ghost"
                    href="#lb-edit"
                    onClick={goEdit}>
                    Explore the Edit
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="lb-marquee" aria-hidden="true">
        <div className="lb-marquee__track lb-display">
          {[0, 1, 2, 3].map((g) => (
            <div className="lb-marquee__group" key={g}>
              {MARQUEE.map((t, i) => (
                <span key={`${g}-${i}`}>
                  {t}
                  <Star />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ TILES ============ */}
      <section className="lb-wrap lb-tiles-wrap">
        <div className="lb-tiles">
          <article className="lb-tile" data-curtain="y" data-d="0">
            <Image
              className="lb-parallax"
              src={IMG.tileA}
              alt="Off-white long-sleeve native set with woven trim"
              fill
              loading="eager"
              sizes="(max-width: 900px) 50vw, 20vw"
            />
            <a
              className="lb-btn lb-btn--light"
              href="/collection"
              onClick={goShop}>
              Explore Now
            </a>
          </article>

          <article className="lb-tile" data-curtain="y" data-d="0.12">
            <Image
              className="lb-parallax"
              src={IMG.tileB}
              alt="Grey long kaftan with elegant embroidery"
              fill
              loading="eager"
              sizes="(max-width: 900px) 50vw, 20vw"
            />
            <a
              className="lb-btn lb-btn--light"
              href="/collection"
              onClick={goShop}>
              Explore Now
            </a>
          </article>

          <article className="lb-promo" data-curtain="y" data-d="0.24">
            <div className="lb-promo__copy">
              <small>Safari Suits</small>
              <h3>Butter Cream Safari Suit for the festive season</h3>
              <a
                className="lb-btn lb-btn--ghost lb-btn--sm"
                href="/collection"
                onClick={goShop}>
                Check Now
              </a>
            </div>
            <div className="lb-promo__media">
              <Image
                className="lb-parallax"
                src={IMG.promoA}
                alt="Butter cream long safari suit with dark brown trousers"
                fill
                loading="eager"
                sizes="(max-width: 900px) 40vw, 18vw"
              />
            </div>
          </article>

          <article className="lb-promo" data-curtain="y" data-d="0.36">
            <div className="lb-promo__copy">
              <small>Kaftans</small>
              <h3>Cream Long-Sleeve Kaftan, finished by hand</h3>
              <a
                className="lb-btn lb-btn--ghost lb-btn--sm"
                href="/collection"
                onClick={goShop}>
                Check Now
              </a>
            </div>
            <div className="lb-promo__media">
              <Image
                className="lb-parallax"
                src={IMG.promoB}
                alt="Cream off-white long-sleeve kaftan"
                fill
                loading="eager"
                sizes="(max-width: 900px) 40vw, 18vw"
              />
            </div>
          </article>
        </div>
      </section>

      {/* ============ THE EDIT ============ */}
      <section className="lb-wrap lb-edit" id="lb-edit">
        <div className="lb-head" data-lb="up">
          <h2 className="lb-display">The Edit</h2>
          <p>
            Every piece in this lookbook is cut and finished in our Lagos
            atelier and available in the shop. Filter by category, add to bag,
            or open the piece for a closer look at the fabric and the finish.
          </p>
        </div>

        <div
          className="lb-chips"
          role="group"
          aria-label="Filter collection"
          data-lb="up"
          data-d="0.1">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              className="lb-chip"
              aria-pressed={c === cat}
              onClick={() => changeCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="lb-products" data-lb="up" data-d="0.15">
          {items.map((p) => (
            <article className="lb-prod" key={p.id}>
              <div className="lb-prod__media">
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 900px) 50vw, 24vw"
                />
                <div className="lb-prod__over">
                  <button
                    type="button"
                    className="lb-btn lb-btn--outline-light lb-btn--sm"
                    onClick={(e) => add(e, p)}>
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="lb-btn lb-btn--light lb-btn--sm"
                    onClick={(e) => buy(e, p)}>
                    Buy Now
                  </button>
                </div>
              </div>
              <div className="lb-prod__row">
                <h3>{p.name}</h3>
                <b>{p.priceLabel}</b>
              </div>
            </article>
          ))}
        </div>
        {items.length === 0 && <p className="lb-empty">Nothing here yet.</p>}
      </section>

      {/* ============ CLOTH HEAD ============ */}
      <section className="lb-wrap lb-split">
        <p data-lb="up">
          More than clothing — a canvas for how you carry yourself. Our kaftans
          and safari suits blend traditional Nigerian dress with a modern cut,
          so you make a statement with every step.
        </p>
        <h2 className="lb-display" data-lb="up" data-d="0.1">
          Kaftans and Safari Suits
          <br />
          Collection
        </h2>
      </section>

      {/* ============ DARK FEATURE ============ */}
      <section className="lb-dark">
        <div className="lb-wrap lb-feature">
          <div className="lb-feature__media" data-curtain="y" data-par="7">
            <Image
              className="lb-parallax"
              src={featureSrc}
              alt="mustard-yellow-safari-suite-short-form"
              fill
              loading="eager"
              sizes="(max-width: 900px) 100vw, 40vw"
              onError={() => {
                if (featureSrc !== FEATURE_FALLBACK)
                  setFeatureSrc(FEATURE_FALLBACK);
              }}
            />
          </div>
          <div className="lb-feature__copy" data-lb="up" data-d="0.15">
            <h2 className="lb-display">
              Safari Suit
              <br />
              Collection
            </h2>
            <p>
              Four working pockets, a banded collar and a shoulder built to hold
              its line. Our safari suits are cut short in the sleeve for Lagos
              heat and finished by hand.
            </p>
            <a
              className="lb-btn lb-btn--outline-light"
              href="#lb-edit"
              onClick={goEdit}>
              Explore the Edit
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
