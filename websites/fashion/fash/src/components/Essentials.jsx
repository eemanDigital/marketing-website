"use client";

import Image from "next/image";
import Icon from "@/components/Icon";
import { ESSENTIALS } from "@/lib/catalog";
import { scrollToTarget } from "@/lib/gsap";

export default function Essentials() {
  const open = (filter) => {
    window.dispatchEvent(new CustomEvent("fash:filter", { detail: filter }));
    scrollToTarget("#shop");
  };

  return (
    <section className="essentials" id="essentials">
      <div className="shell">
        <header className="section-head" data-reveal>
          <h2>Essentials</h2>
          <p>The pieces our clients keep coming back for</p>
        </header>

        <div className="bento">
          {ESSENTIALS.map((t) => (
            <button
              key={t.idx}
              className={`tile ${t.shape}`}
              data-reveal
              type="button"
              onClick={() => open(t.filter)}
            >
              <Image
                src={t.img}
                alt={t.alt}
                fill
                sizes="(max-width: 620px) 92vw, (max-width: 1024px) 46vw, 24vw"
                quality={80}
              />
              <span className="tile__veil" aria-hidden="true" />
              <span className="tile__idx" aria-hidden="true">
                {t.idx}
              </span>
              <span className="tile__cap">
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.sub}</p>
                </div>
                <span className="tile__go" aria-hidden="true">
                  <Icon name="arrowRight" />
                </span>
              </span>
              <span className="sr-only">Shop {t.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}