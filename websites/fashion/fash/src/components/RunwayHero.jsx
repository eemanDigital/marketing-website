"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { HERO_SLIDES } from "@/lib/catalog";
import { naira } from "@/lib/format";
import { getGsap, prefersReducedMotion, scrollToTarget } from "@/lib/gsap";

/* The runway advances every ten seconds. */
const AUTOPLAY = 10;

const pad = (n) => String(n).padStart(2, "0");

/* The editorial runway: one look owns the stage — copy on the left,
   the worn piece centre stage, its paired dress form in the product
   rail on the right, and the show controls on the floor. Driven
   entirely by HERO_SLIDES, so a new look is one catalogue entry. */
export default function RunwayHero() {
  const { openQuickView } = useStore();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const productRef = useRef(null);
  const bgRef = useRef(null);
  const fillRef = useRef(null);
  const timeRef = useRef(null);
  const statusRef = useRef(null);

  const gsapRef = useRef(null);
  const indexRef = useRef(0);
  const busyRef = useRef(false);
  const playingRef = useRef(true);
  const progressRef = useRef(null);
  const resumeAtRef = useRef(0);
  const introPlayed = useRef(false);
  const kenRef = useRef(null);

  const total = HERO_SLIDES.length;
  const look = HERO_SLIDES[index];
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  const clearProgress = () => {
    if (progressRef.current) {
      progressRef.current.kill();
      progressRef.current = null;
    }
  };

  const setTimeText = (p) => {
    const el = timeRef.current;
    if (!el) return;
    const elapsed = Math.min(AUTOPLAY, Math.round(p * AUTOPLAY));
    el.textContent = `0:${pad(elapsed)} / 0:${pad(AUTOPLAY)}`;
  };

  /* The progress bar doubles as the auto-advance timer: when it fills,
     the next look takes the stage. Pausing freezes it where it stands. */
  const startProgress = (from = 0) => {
    const g = gsapRef.current;
    const fill = fillRef.current;
    clearProgress();
    if (!fill) return;
    resumeAtRef.current = from;
    setTimeText(from);
    if (!g) {
      fill.style.width = `${from * 100}%`;
      return;
    }
    if (!playingRef.current || document.hidden) {
      g.set(fill, { width: `${from * 100}%` });
      return;
    }
    let tw = null;
    tw = g.fromTo(
      fill,
      { width: `${from * 100}%` },
      {
        width: "100%",
        duration: Math.max(0.3, AUTOPLAY * (1 - from)),
        ease: "none",
        onUpdate: () => {
          if (tw) setTimeText(from + tw.progress() * (1 - from));
        },
        onComplete: () => {
          progressRef.current = null;
          goTo(indexRef.current + 1);
        },
      },
    );
    progressRef.current = tw;
  };

  const pauseProgress = () => {
    const tw = progressRef.current;
    if (!tw) return;
    const from = resumeAtRef.current;
    resumeAtRef.current = Math.min(1, from + tw.progress() * (1 - from));
    tw.kill();
    progressRef.current = null;
  };

  const killKen = () => {
    if (kenRef.current) {
      kenRef.current.kill();
      kenRef.current = null;
    }
  };

  /* Slow drift on the worn image so the stage never sits still. */
  const startKen = () => {
    const g = gsapRef.current;
    killKen();
    if (!g || prefersReducedMotion()) return;
    const img =
      trackRef.current?.children[indexRef.current]?.querySelector(".runway__look-img");
    if (!img) return;
    kenRef.current = g.fromTo(
      img,
      { scale: 1, xPercent: 0 },
      {
        scale: 1.045,
        xPercent: 1.4,
        duration: 7,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
    );
  };

  /* Everything that moves with the state change: copy, product, backdrop. */
  const commit = (target) => {
    const s = HERO_SLIDES[target];
    indexRef.current = target;
    setIndex(target);
    if (statusRef.current) {
      statusRef.current.textContent = `Look ${target + 1} of ${total}: ${s.title}`;
    }
    const bg = bgRef.current;
    if (!bg) return;
    const g = gsapRef.current;
    if (g && !prefersReducedMotion()) {
      g.to(bg, {
        backgroundColor: s.bg,
        duration: 1.1,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      bg.style.backgroundColor = s.bg;
    }
  };

  const goTo = (next) => {
    const target = ((next % total) + total) % total;
    if (busyRef.current || target === indexRef.current || !introPlayed.current) {
      return;
    }

    const g = gsapRef.current;
    /* Reduced motion or no gsap: the look simply swaps. */
    if (!g || prefersReducedMotion()) {
      clearProgress();
      commit(target);
      startKen();
      startProgress(0);
      return;
    }

    const track = trackRef.current;
    const outWrap = track?.children[indexRef.current]?.querySelector(".runway__look-wrap");
    const innWrap = track?.children[target]?.querySelector(".runway__look-wrap");
    const copyBits = [titleRef.current, descRef.current, productRef.current].filter(
      Boolean,
    );
    if (!outWrap || !innWrap || copyBits.length !== 3) return;

    busyRef.current = true;
    clearProgress();
    killKen();
    resumeAtRef.current = 0;
    if (fillRef.current) g.set(fillRef.current, { width: "0%" });
    setTimeText(0);

    /* Exit pushes the worn image back into blur while the copy drains;
       the midpoint commits the new look (backdrop, deck, rail); the
       entrance slides the new model in from the side as everything
       refills behind it. */
    g.timeline({
      onComplete: () => {
        busyRef.current = false;
        g.set([outWrap, innWrap, ...copyBits], {
          clearProps: "opacity,visibility,transform,filter",
        });
        startKen();
        startProgress(0);
      },
    })
      .to(
        outWrap,
        { autoAlpha: 0, y: 26, scale: 1.04, filter: "blur(12px)", duration: 0.5, ease: "power2.in" },
        0,
      )
      .to(
        copyBits,
        { autoAlpha: 0, y: 16, duration: 0.42, stagger: 0.05, ease: "power2.in" },
        0,
      )
      .call(() => commit(target), null, 0.52)
      .fromTo(
        innWrap,
        { autoAlpha: 0, y: 44, x: 40, scale: 1.08, filter: "blur(16px)" },
        {
          autoAlpha: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.05,
          ease: "power3.out",
        },
        0.52,
      )
      .fromTo(
        titleRef.current,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
        0.62,
      )
      .fromTo(
        descRef.current,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" },
        0.68,
      )
      .fromTo(
        productRef.current,
        { autoAlpha: 0, x: 48 },
        { autoAlpha: 1, x: 0, duration: 0.75, ease: "power3.out" },
        0.66,
      );
  };

  const togglePlay = () => {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    if (next) startProgress(resumeAtRef.current);
    else pauseProgress();
  };

  /* One-time setup: intro, controls, keyboard and swipe navigation. */
  useEffect(() => {
    let cancelled = false;
    let ctx = null;
    const root = rootRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!root || !stage || !track) return;

    if (prefersReducedMotion()) {
      playingRef.current = false;
      setPlaying(false);
    }
    if (statusRef.current) {
      statusRef.current.textContent = `Look 1 of ${total}: ${HERO_SLIDES[0].title}`;
    }

    const playIntro = () => {
      if (introPlayed.current) return;
      introPlayed.current = true;
      busyRef.current = true;
      const g = gsapRef.current;
      if (!g || prefersReducedMotion()) {
        busyRef.current = false;
        startKen();
        startProgress(0);
        return;
      }
      const active = track.children[indexRef.current];
      const wrap = active?.querySelector(".runway__look-wrap");
      ctx = g.context(() => {
        g.timeline({
          defaults: { ease: "power4.out" },
          onComplete: () => {
            busyRef.current = false;
            startKen();
            startProgress(0);
          },
        })
          .from(".runway__frame", { autoAlpha: 0, y: 30, duration: 1.1 }, 0)
          .from(".runway__copy .eyebrow", { y: 18, autoAlpha: 0, duration: 0.8 }, 0.25)
          .from(titleRef.current, { y: 34, autoAlpha: 0, duration: 0.95 }, 0.35)
          .from(descRef.current, { y: 22, autoAlpha: 0, duration: 0.85 }, 0.5)
          .from(
            ".runway__cta > *",
            { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
            0.62,
          )
          .fromTo(
            wrap,
            { autoAlpha: 0, y: 70, scale: 1.05, filter: "blur(16px)" },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: 1.3,
            },
            0.3,
          )
          .from(".runway__deck", { y: 34, autoAlpha: 0, duration: 0.9 }, 0.55)
          .from(productRef.current, { x: 56, autoAlpha: 0, duration: 0.9 }, 0.7)
          .from(".runway__rail-nav", { autoAlpha: 0, duration: 0.7 }, 0.95)
          .from(".runway__controls", { y: 28, autoAlpha: 0, duration: 0.85 }, 0.8);
      }, root);
    };

    let revealed = document.documentElement.dataset.revealed === "1";
    let gsapReady = false;
    const tryIntro = () => {
      if (revealed && gsapReady) playIntro();
    };
    const revealHandler = () => {
      revealed = true;
      tryIntro();
    };
    if (!revealed) {
      document.addEventListener("fash:revealed", revealHandler, { once: true });
    }

    const onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = document.activeElement;
      if (el && /input|textarea/i.test(el.tagName)) return;
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      goTo(indexRef.current + (e.key === "ArrowRight" ? 1 : -1));
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
        goTo(indexRef.current + (dx < 0 ? 1 : -1));
      }
    };
    const onVisibility = () => {
      if (document.hidden) pauseProgress();
      else if (playingRef.current) startProgress(resumeAtRef.current);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    stage.addEventListener("pointerdown", onPointerDown, { passive: true });
    stage.addEventListener("pointerup", onPointerUp, { passive: true });

    (async () => {
      try {
        const mod = await getGsap();
        if (cancelled) return;
        gsapRef.current = mod.gsap;
      } catch {
        /* no gsap — looks still swap through CSS classes */
      }
      if (cancelled) return;
      gsapReady = true;
      tryIntro();
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("fash:revealed", revealHandler);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      clearProgress();
      killKen();
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="runway" id="top" ref={rootRef}>
      <div
        className="runway__bg"
        ref={bgRef}
        style={{ backgroundColor: HERO_SLIDES[0].bg }}
        aria-hidden="true"
      />

      <div className="runway__frame">
        <div className="runway__body">
          <aside className="runway__copy">
            <p className="eyebrow">{look.collection}</p>
            <h1 className="runway__title" ref={titleRef}>
              {look.look}
              <span className="sr-only">
                {" "}
                — {look.title} from the {look.collection} collection by FASH
              </span>
            </h1>
            <p className="runway__desc" ref={descRef}>
              {look.description}
            </p>
            <div className="runway__cta">
              <button
                className="btn btn--solid"
                type="button"
                onClick={() => scrollToTarget("#lookbook")}
              >
                <span>Explore Collection</span>
              </button>
              <a
                className="ulink"
                href="#shop"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget("#shop");
                }}
              >
                Shop The Drop
              </a>
            </div>
          </aside>

          <div className="runway__stage" ref={stageRef}>
            <div className="runway__slides" ref={trackRef}>
              {HERO_SLIDES.map((s, i) => (
                <article
                  key={s.id}
                  className={`runway__look${i === index ? " is-active" : ""}`}
                  aria-roledescription="slide"
                  aria-label={`Look ${i + 1} of ${total}: ${s.title}`}
                  aria-hidden={i === index ? "false" : "true"}
                >
                  <div className="runway__look-wrap">
                    <Image
                      className="runway__look-img"
                      src={s.img}
                      alt={s.alt}
                      width={s.width}
                      height={s.height}
                      sizes="(max-width: 650px) 92vw, (max-width: 1024px) 56vw, 46vw"
                      loading="eager"
                      preload={i === 0}
                    />
                  </div>
                </article>
              ))}
            </div>
            <div className="runway__fade" aria-hidden="true" />
          </div>

          <aside className="runway__rail">
            {/* Prev and next dress forms peek from behind the active one */}
            <div className="runway__deck" aria-hidden="true">
              {HERO_SLIDES.map((s, i) => (
                <div
                  key={s.id}
                  className={`runway__deck-card${i === index ? " is-active" : ""}${
                    i === prevIndex ? " is-prev" : ""
                  }${i === nextIndex ? " is-next" : ""}`}
                  style={{ "--tint": s.tint }}
                >
                  <Image
                    src={s.formImg}
                    alt=""
                    width={s.formWidth}
                    height={s.formHeight}
                    sizes="(max-width: 650px) 130px, 260px"
                  />
                </div>
              ))}
            </div>

            <div className="runway__product" ref={productRef}>
              <div className="runway__product-info">
                <span className="runway__product-label">Featured piece</span>
                <h2 className="runway__product-name">{look.product.name}</h2>
                <span className="runway__product-meta">{look.caption}</span>
                <span className="runway__product-price">{naira(look.product.price)}</span>
              </div>
              <button
                className="runway__add"
                type="button"
                aria-label={`Quick view: ${look.product.name}`}
                onClick={() => openQuickView(look.product.productId)}
              >
                <Icon name="plus" />
              </button>
            </div>

            <div className="runway__rail-nav">
              <button
                className="btn btn--outline btn--icon"
                type="button"
                aria-label="Previous look"
                onClick={() => goTo(index - 1)}
              >
                <Icon name="arrowLeft" />
              </button>
              <span className="runway__rail-count" aria-hidden="true">
                <b>{pad(index + 1)}</b>
                <i />
                {pad(total)}
              </span>
              <button
                className="btn btn--outline btn--icon"
                type="button"
                aria-label="Next look"
                onClick={() => goTo(index + 1)}
              >
                <Icon name="arrowRight" />
              </button>
            </div>
          </aside>
        </div>

        <footer className="runway__controls">
          <button
            className={`runway__play${playing ? " is-playing" : ""}`}
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause the runway" : "Play the runway"}
          >
            <span className="runway__play-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
          <span className="runway__time" ref={timeRef} aria-hidden="true">
            {"0:00 / 0:10"}
          </span>
          <div className="runway__track" aria-hidden="true">
            <span ref={fillRef} />
          </div>
          <button
            className="runway__next"
            type="button"
            aria-label="Next look"
            onClick={() => goTo(index + 1)}
          >
            <Icon name="arrowRight" />
          </button>
        </footer>
      </div>

      <p className="sr-only" role="status" aria-live="polite" ref={statusRef} />
    </section>
  );
}
