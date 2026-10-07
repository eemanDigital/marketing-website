"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { Stars } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { FILTERS, PRODUCTS } from "@/lib/catalog";
import { naira } from "@/lib/format";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price: Low to high" },
  { value: "high", label: "Price: High to low" },
  { value: "rating", label: "Top rated" },
];

export default function Shop() {
  const { addItem, saved, toggleSaved, openQuickView } = useStore();
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("featured");
  const gridRef = useRef(null);

  useEffect(() => {
    const onShowSaved = () => setFilter("Saved");
    const onFilter = (e) => setFilter(e.detail || "All");
    window.addEventListener("fash:show-saved", onShowSaved);
    window.addEventListener("fash:filter", onFilter);
    return () => {
      window.removeEventListener("fash:show-saved", onShowSaved);
      window.removeEventListener("fash:filter", onFilter);
    };
  }, []);

  const list = useMemo(() => {
    let out = PRODUCTS.filter((p) => {
      if (filter === "Saved") return saved.includes(p.id);
      if (filter === "All") return true;
      return p.cat === filter;
    });
    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    return out;
  }, [filter, sort, saved]);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".product");
    if (!cards?.length) return;
    cards.forEach((c) => c.classList.add("is-entering"));
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        cards.forEach((c) => c.classList.remove("is-entering")),
      ),
    );
    return () => cancelAnimationFrame(raf);
  }, [filter, sort]);

  return (
    <section className="shop" id="shop">
      <div className="shell">
        <header className="section-head" data-reveal>
          <h2>Shop</h2>
          <p>Festive 2025 — cut and finished in Lagos</p>
        </header>

        <div className="shop__bar">
          <div className="filters" role="group" aria-label="Filter pieces">
            {[...FILTERS, "Saved"].map((f) => (
              <button
                key={f}
                className="chip"
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
                {f === "Saved" && saved.length > 0 ? ` (${saved.length})` : ""}
              </button>
            ))}
          </div>

          <div className="shop__sort">
            <label htmlFor="shopSort">Sort</label>
            <select
              id="shopSort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <p className="shop__count" aria-live="polite">
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <div className="grid-products" ref={gridRef}>
          {list.map((p) => {
            const isSaved = saved.includes(p.id);
            return (
              <article className="product" key={p.id} data-reveal>
                <div className="product__media">
                  <span className="product__tags">
                    {p.badge && (
                      <span
                        className={`tag ${p.badge === "Sale" ? "tag--sale" : "tag--new"}`}
                      >
                        {p.badge}
                      </span>
                    )}
                  </span>
                  <button
                    className="product__fav"
                    type="button"
                    aria-pressed={isSaved}
                    aria-label={
                      isSaved
                        ? `Remove ${p.name} from saved`
                        : `Save ${p.name}`
                    }
                    onClick={() => toggleSaved(p)}
                  >
                    <Icon name="heart" fill={isSaved} />
                  </button>
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 620px) 92vw, (max-width: 1024px) 46vw, 255px"
                    quality={78}
                  />
                  <Image
                    className="is-alt"
                    src={p.altImg}
                    alt=""
                    fill
                    sizes="(max-width: 620px) 92vw, (max-width: 1024px) 46vw, 255px"
                    quality={70}
                    loading="lazy"
                  />
                  <button
                    className="product__quick"
                    type="button"
                    onClick={() => openQuickView(p.id)}
                  >
                    Quick view
                  </button>
                </div>
                <div className="product__body">
                  <span className="product__cat">{p.cat}</span>
                  <h3 className="product__name">{p.name}</h3>
                  <div className="product__meta">
                    <span className="product__price">
                      {p.compareAt && <del>{naira(p.compareAt)}</del>}
                      {naira(p.price)}
                    </span>
                    <span className="product__stars">
                      <Stars rating={p.rating} />
                    </span>
                  </div>
                  <div className="swatches">
                    {p.swatches.map((c) => (
                      <span
                        className="swatch"
                        key={c}
                        style={{ background: c }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <button
                    className="btn btn--solid product__add"
                    type="button"
                    onClick={() => addItem(p)}
                  >
                    <span>Add to bag</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {list.length === 0 && (
          <p className="empty-note">No pieces in this edit yet.</p>
        )}
      </div>
    </section>
  );
}
