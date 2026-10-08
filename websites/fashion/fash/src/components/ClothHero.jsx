"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { Stars } from "@/components/Icon";
import { getGsap, prefersReducedMotion, scrollToTarget } from "@/lib/gsap";

/* Four worn pieces form the sliding strip. next/image runs in `fill`
   mode, so the cards size themselves and no width/height is needed. */
const CARDS = [
  {
    src: "/images/charcoal-kaftan-long-sleeve.jpg",
    alt: "Charcoal long-sleeve kaftan with tonal chest embroidery",
    label: "Charcoal Kaftan",
  },
  {
    src: "/images/offwhite-long-sleeve.jpg",
    alt: "Off-white long-sleeve native set with woven trim",
    label: "Off-White Long Sleeve",
  },
  {
    src: "/images/dark-burgundy-kaftan.jpg",
    alt: "Dark burgundy kaftan with gold embroidered placket",
    label: "Burgundy Kaftan",
  },
  {
    src: "/images/butter-cream-dark-brown-long-safari-suit.jpg",
    alt: "Butter cream safari suit with dark brown trousers",
    label: "Safari Suit",
  },
];

/* Doubled so a card that leaves on the left can re-enter on the right
   off-screen: the loop never visibly resets. */
const LOOP = [...CARDS, ...CARDS];
const GAP = 14;

/* How many cards fit in the strip at a given width. */
const visibleFor = (w) => (w < 560 ? 2 : w < 900 ? 3 : 4);

export default function ClothHero() {
  const rootRef = useRef(null);
  const stripRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const strip = stripRef.current;
    if (!root || !strip) return;

    const cards = Array.from(strip.querySelectorAll(".cloth-hero__card"));
    const imgs = cards.map((c) => c.querySelector("img"));
    const reduced = prefersReducedMotion();

    let step = 0;
    let cancelled = false;
    let gsapLib = null;
    let ctx = null;
    let timer = null;
    let tl = null;
    let looping = false;
    let raf = 0;

    /* Size the cards from the strip width. Always runs, even with
       reduced motion, so the layout is correct without GSAP. */
    const measure = () => {
      const w = strip.clientWidth;
      const vis = visibleFor(w);
      const cw = (w - GAP * (vis - 1)) / vis;
      step = cw + GAP;
      cards.forEach((c) => {
        c.style.width = `${cw}px`;
      });
    };

    const place = () => {
      cards.forEach((c, i) => {
        c.style.transform = `translate3d(${i * step}px,0,0)`;
      });
    };

    measure();
    place();
    strip.classList.add("is-ready");

    /* The signature motion: every card slides one step left in a
       cascade, each 0.1s behind its neighbour, with a skew flick and a
       parallax drift on the photo inside. A fresh tween per step keeps
       the relative "-=" values correct on every loop. */
    const slide = () => {
      const { gsap } = gsapLib;
      const wrap = gsap.utils.wrap(-step, step * (LOOP.length - 1));

      tl = gsap.timeline({
        onComplete: () => {
          timer = gsap.delayedCall(1.5, slide);
        },
      });

      tl.to(
        cards,
        {
          x: `-=${step}`,
          duration: 1.3,
          ease: "expo.inOut",
          stagger: 0.1,
          modifiers: { x: gsap.utils.unitize((v) => wrap(parseFloat(v))) },
        },
        0,
      )
        .to(
          cards,
          {
            skewX: -8,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.1,
            yoyo: true,
            repeat: 1,
          },
          0,
        )
        .to(
          imgs,
          {
            xPercent: -4,
            duration: 0.65,
            ease: "power2.inOut",
            stagger: 0.1,
            yoyo: true,
            repeat: 1,
          },
          0,
        );
    };

    const startLoop = () => {
      if (!gsapLib || looping || cancelled) return;
      looping = true;
      timer = gsapLib.gsap.delayedCall(1.2, slide);
    };

    const stopLoop = () => {
      looping = false;
      if (timer) timer.kill();
      if (tl) tl.kill();
      timer = tl = null;
      if (gsapLib) gsapLib.gsap.killTweensOf([...cards, ...imgs]);
    };

    /* Re-measure on resize; restart the loop from a clean row. */
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wasLooping = looping;
        stopLoop();
        measure();
        if (gsapLib) {
          gsapLib.gsap.set(cards, { x: (i) => i * step, skewX: 0 });
          gsapLib.gsap.set(imgs, { xPercent: 0 });
        } else {
          place();
        }
        if (wasLooping) startLoop();
      });
    });
    ro.observe(strip);

    /* Opening choreography, fired once the preloader hands over. */
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      getGsap()
        .then((lib) => {
          if (cancelled) return;
          gsapLib = lib;
          const { gsap } = lib;

          /* Hand the cards over from inline CSS transforms to GSAP. */
          gsap.set(cards, { x: (i) => i * step });
          gsap.set(imgs, { scale: 1.12 });

          ctx = gsap.context(() => {
            gsap
              .timeline({
                defaults: { ease: "power3.out" },
                onComplete: startLoop,
              })
              .from(
                ".cloth-hero__panel",
                { y: 56, autoAlpha: 0, duration: 1.1 },
                0,
              )
              .from(
                ".cloth-hero__line > span",
                { yPercent: 115, duration: 1, stagger: 0.12 },
                0.15,
              )
              .from(
                ".cloth-hero__desc",
                { y: 18, autoAlpha: 0, duration: 0.8 },
                0.5,
              )
              .from(
                ".cloth-hero__card",
                {
                  xPercent: 140,
                  skewX: -14,
                  autoAlpha: 0,
                  duration: 1.5,
                  stagger: 0.09,
                  ease: "expo.out",
                },
                0.55,
              )
              .from(
                ".cloth-hero__bar > *",
                { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.1 },
                1.1,
              );

            gsap.to(".cloth-hero__badge-ring", {
              rotation: 360,
              duration: 14,
              ease: "none",
              repeat: -1,
            });
            gsap.to(".cloth-hero__more-btn i", {
              y: 4,
              duration: 0.8,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }, root);
        })
        .catch(() => {
          /* no gsap: the hero is already laid out and fully visible */
        });
    };

    if (!reduced) {
      const revealed = document.documentElement.dataset.revealed === "1";
      if (revealed) play();
      else document.addEventListener("fash:revealed", play, { once: true });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("fash:revealed", play);
      stopLoop();
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section className="cloth-hero" id="top" ref={rootRef}>
      <div className="cloth-hero__panel">
        <div className="cloth-hero__copy">
          <h1 className="cloth-hero__title">
            <span className="cloth-hero__line">
              <span>Express Your Identity with</span>
            </span>
            <span className="cloth-hero__line">
              <span className="is-accent">Our Unique Style</span>
            </span>
          </h1>

          <p className="cloth-hero__desc">
            Showcase your true self with our distinctive clothing collection
            that blends style and individuality.
          </p>
        </div>

        <div className="cloth-hero__strip" ref={stripRef}>
          {LOOP.map((s, i) => {
            const dup = i >= CARDS.length;
            return (
              <figure
                className="cloth-hero__card"
                key={`${s.src}-${i}`}
                aria-hidden={dup ? "true" : undefined}>
                <Image
                  src={s.src}
                  alt={dup ? "" : s.alt}
                  fill
                  sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                  priority={i < 2}
                  loading={dup ? "lazy" : "eager"}
                />
                {!dup && (
                  <figcaption className="cloth-hero__card-cap">
                    {s.label}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>

        <div className="cloth-hero__bar">
          <div className="cloth-hero__proof">
            <Stars className="cloth-hero__stars" rating={5} />
            <p className="cloth-hero__score">
              <b>10K+</b> <span>Reviews</span>
            </p>
            <p className="cloth-hero__note">Customers are satisfied</p>
          </div>

          <a
            className="cloth-hero__more"
            href="#lookbook"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#lookbook");
            }}>
            <span>Explore More</span>
            <span className="cloth-hero__more-btn" aria-hidden="true">
              <i>
                <svg viewBox="0 0 24 24" className="ico">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </i>
            </span>
          </a>

          <div className="cloth-hero__badge" aria-hidden="true">
            <svg className="cloth-hero__badge-ring" viewBox="0 0 100 100">
              <defs>
                <path
                  id="clothBadgePath"
                  d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
                />
              </defs>
              <text>
                <textPath href="#clothBadgePath">
                  BEST DESIGN AND QUALITY •
                </textPath>
              </text>
            </svg>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
