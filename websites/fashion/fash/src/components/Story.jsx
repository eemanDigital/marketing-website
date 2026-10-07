"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { STORY } from "@/lib/catalog";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

export default function Story() {
  const sectionRef = useRef(null);
  const wordRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const word = wordRef.current;
    if (!section || !word) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let ctx = null;

    (async () => {
      try {
        const { gsap } = await getGsap();
        if (cancelled) return;

        ctx = gsap.context(() => {
          const text = word.textContent;
          word.textContent = "";
          for (let i = 0; i < text.length; i++) {
            const span = document.createElement("span");
            span.className = "ch";
            span.textContent = text[i] === " " ? " " : text[i];
            word.appendChild(span);
          }

          gsap.fromTo(
            ".story__word .ch",
            { xPercent: -60, autoAlpha: 0.25 },
            {
              xPercent: 60,
              autoAlpha: 1,
              ease: "none",
              stagger: { each: 0.02, from: "start" },
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );

          [
            [".story__float--a", -240, 6],
            [".story__float--b", 210, -5],
          ].forEach(([sel, y, rot]) => {
            gsap.fromTo(
              sel,
              { y: 0, rotate: rot > 0 ? -3 : 3 },
              {
                y,
                rotate: rot,
                scale: 1.05,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          gsap.from(".story__float", {
            autoAlpha: 0,
            scale: 0.94,
            duration: 1.2,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          });

          gsap.fromTo(
            ".story__card",
            { y: 70, autoAlpha: 0, clipPath: "inset(14% 0% 14% 0%)" },
            {
              y: 0,
              autoAlpha: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 62%",
                toggleActions: "play none none reverse",
              },
            },
          );

          section.querySelectorAll(".story__float").forEach((fig, i) => {
            gsap.to(fig, {
              y: i % 2 ? -10 : 10,
              duration: 4.4 + i * 0.7,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          });
        }, section);
      } catch {
        /* static story section */
      }
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section className="story" id="story" ref={sectionRef}>
      <div className="story__word" id="storyWord" aria-hidden="true" ref={wordRef}>
        Nigerian Roots
      </div>

      <figure className="story__float story__float--a">
        <Image
          src={STORY.floatA.img}
          alt={STORY.floatA.alt}
          width={STORY.floatA.width}
          height={STORY.floatA.height}
          sizes="(max-width: 1024px) 30vw, 17vw"
          quality={80}
        />
      </figure>
      <figure className="story__float story__float--b">
        <Image
          src={STORY.floatB.img}
          alt={STORY.floatB.alt}
          width={STORY.floatB.width}
          height={STORY.floatB.height}
          sizes="(max-width: 1024px) 30vw, 17vw"
          quality={80}
        />
      </figure>

      <div className="story__card">
        <p className="eyebrow">{STORY.eyebrow}</p>
        <h2>{STORY.title}</h2>
        <p>{STORY.copy}</p>
        <div className="story__stats">
          {STORY.stats.map((s) => (
            <div key={s.label}>
              <strong>
                <span data-count={s.value}>{s.value}</span>
                {s.suffix}
              </strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
