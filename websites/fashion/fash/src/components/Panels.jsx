"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { FILTERS, PRODUCTS } from "@/lib/catalog";
import { SIZE_GUIDE } from "@/lib/site";
import { naira } from "@/lib/format";

const SIZES = ["S", "M", "L", "XL", "XXL"];

function Highlight({ text, q }) {
  const query = q.trim();
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function QuickView({ product, onClose }) {
  const { addItem, saved, toggleSaved } = useStore();
  const [size, setSize] = useState("M");
  const isSaved = saved.includes(product.id);

  return (
    <div className="qv" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="qv__media">
        <Image
          src={product.img}
          alt={product.alt}
          fill
          sizes="(max-width: 820px) 100vw, 470px"
          quality={80}
        />
      </div>
      <div className="qv__body">
        <span className="product__cat">{product.cat}</span>
        <h2>{product.name}</h2>
        <p className="product__price qv__price">
          {product.compareAt && <del>{naira(product.compareAt)}</del>}
          {naira(product.price)}
        </p>
        <p className="qv__desc">{product.desc}</p>

        <div className="opt-row">
          <span className="opt-row__label">
            Size
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("fash:size-guide"))
              }
            >
              <b>Open size guide</b>
            </button>
          </span>
          <div className="sizes">
            {SIZES.map((s, i) => (
              <button
                key={s}
                className={`size${i === 3 ? " is-out" : ""}${size === s ? " is-active" : ""}`}
                type="button"
                aria-pressed={size === s}
                disabled={i === 3}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="opt-row">
          <span className="opt-row__label">Colour</span>
          <div className="sizes">
            {product.swatches.map((c) => (
              <span
                key={c}
                className="swatch"
                style={{ background: c }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="qv__actions">
          <button
            className="btn btn--solid"
            type="button"
            onClick={() => {
              addItem(product, size);
              onClose();
            }}
          >
            <span>Add to bag — {naira(product.price)}</span>
          </button>
          <button
            className="btn btn--outline btn--icon"
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from saved" : "Save for later"}
            onClick={() => toggleSaved(product)}
          >
            <Icon name="heart" fill={isSaved} />
          </button>
        </div>

        <div className="qv__meta">
          <div>
            <Icon name="check" aria-hidden="true" />
            Free delivery nationwide, returns included
          </div>
          <div>
            <Icon name="check" aria-hidden="true" />
            Alterations included on every order
          </div>
          <div>
            <Icon name="check" aria-hidden="true" />
            Hand-finished in our Lagos atelier
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeGuide() {
  return (
    <div
      className="guide"
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      style={{ padding: "clamp(1.5rem, 3vw, 2.25rem)" }}
    >
      <table>
        <caption>
          Size chart — inches. Take chest measurement at the widest point.
        </caption>
        <thead>
          <tr>
            {SIZE_GUIDE.head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZE_GUIDE.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={`${row[0]}-${i}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="guide__note">{SIZE_GUIDE.note}</p>
    </div>
  );
}

function SearchOverlay() {
  const { closePanel, openQuickView } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.cat.toLowerCase().includes(query),
        )
      : PRODUCTS.slice(0, 6);
    return list.slice(0, 6);
  }, [q]);

  const pick = (id) => {
    closePanel();
    openQuickView(id);
  };

  return (
    <>
      <div className="search-bar">
        <Icon name="search" aria-hidden="true" />
        <label className="sr-only" htmlFor="searchInput">
          Search the collection
        </label>
        <input
          id="searchInput"
          type="search"
          placeholder="Search kaftans, safari suits…"
          value={q}
          ref={inputRef}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="search-suggest">
        {FILTERS.filter((f) => f !== "All").map((f) => (
          <button key={f} className="chip" type="button" onClick={() => setQ(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="search-results">
        {results.map((p) => (
          <button
            key={p.id}
            className="result"
            type="button"
            onClick={() => pick(p.id)}
          >
            <Image src={p.img} alt="" width={54} height={66} />
            <span>
              <strong>
                <Highlight text={p.name} q={q} />
              </strong>
              <span>{p.cat}</span>
            </span>
            <b>{naira(p.price)}</b>
          </button>
        ))}
        {results.length === 0 && (
          <p className="empty-note">
            No pieces match “{q}”. Try “kaftan” or “safari”.
          </p>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>
    </>
  );
}

function CartLines() {
  const { items, setQty, removeItem, closePanel, openQuickView } = useStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <Icon name="bag" aria-hidden="true" />
        <p>Your bag is empty.</p>
        <button
          className="btn btn--solid"
          type="button"
          onClick={() => {
            closePanel();
            router.push("/collection");
          }}
        >
          <span>Browse the edit</span>
        </button>
      </div>
    );
  }

  return items.map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    if (!p) return null;
    return (
      <div className="cart-line" key={i.id}>
        <button
          className="cart-line__media"
          type="button"
          aria-label={`View ${p.name}`}
          onClick={() => {
            closePanel();
            openQuickView(p.id);
          }}
        >
          <Image src={p.img} alt="" fill sizes="76px" />
        </button>
        <div>
          <h4 className="cart-line__name">{p.name}</h4>
          <p className="cart-line__opt">Size {i.size}</p>
          <div className="cart-line__row">
            <div className="qty">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty(i.id, i.qty - 1)}
              >
                <Icon name="minus" />
              </button>
              <output>{i.qty}</output>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty(i.id, i.qty + 1)}
              >
                <Icon name="plus" />
              </button>
            </div>
            <span className="cart-line__price">{naira(p.price * i.qty)}</span>
          </div>
          <button
            className="cart-line__rm"
            type="button"
            onClick={() => removeItem(i.id)}
          >
            Remove
          </button>
        </div>
      </div>
    );
  });
}

function CartSummary() {
  const { items, toast } = useStore();
  const subtotal = items.reduce((sum, i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    return sum + (p?.price || 0) * i.qty;
  }, 0);
  const delivery = subtotal >= 150000 || subtotal === 0 ? 0 : 5000;

  return (
    <>
      <dl className="totals">
        <dt>Subtotal</dt>
        <dd>{naira(subtotal)}</dd>
      </dl>
      <dl className="totals">
        <dt>Delivery</dt>
        <dd>{delivery === 0 ? "Free" : naira(delivery)}</dd>
      </dl>
      <dl className="totals totals--grand">
        <dt>Total</dt>
        <dd>{naira(subtotal + delivery)}</dd>
      </dl>
      <button
        className="btn btn--solid btn--block"
        type="button"
        style={{ marginBottom: "0.7rem" }}
        onClick={() =>
          toast("Checkout is a demo — your order is safe in the bag", "check")
        }
      >
        <span>Checkout securely</span>
      </button>
      <p className="cart-note">
        Alterations included on every order. Delivery nationwide in 2–5 working
        days.
      </p>
    </>
  );
}

export default function Panels() {
  const {
    panel,
    closePanel,
    openPanel,
    quickViewId,
    closeQuickView,
    toasts,
  } = useStore();

  const product = quickViewId
    ? PRODUCTS.find((p) => p.id === quickViewId) || null
    : null;
  const openKind = quickViewId ? "qv" : panel;
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const isOpen = Boolean(openKind);
    document.documentElement.classList.toggle("is-locked", isOpen);
    if (!isOpen) return;

    const restore = document.activeElement;
    const focusables = () =>
      Array.from(
        root.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.getClientRects().length > 0);

    const firstTick = setTimeout(() => {
      const els = focusables();
      (els[0] || root).focus();
    }, 60);

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (openKind === "qv") closeQuickView();
        else closePanel();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(firstTick);
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("is-locked");
      if (restore && restore.focus) restore.focus();
    };
  }, [openKind, quickViewId, closeQuickView, closePanel]);

  /* Size-guide shortcut: from the quick view, flip to the size guide. */
  useEffect(() => {
    const onSizeGuide = () => {
      if (quickViewId) closeQuickView();
      openPanel("sizeguide");
    };
    document.addEventListener("fash:size-guide", onSizeGuide);
    return () =>
      document.removeEventListener("fash:size-guide", onSizeGuide);
  }, [quickViewId, closeQuickView, openPanel]);

  /* Toasts entry animation — pure CSS, driven by the is-in class. */
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      document
        .querySelectorAll(".toast:not(.is-in)")
        .forEach((el) => el.classList.add("is-in")),
    );
    const fallback = setTimeout(() => {
      document
        .querySelectorAll(".toast:not(.is-in)")
        .forEach((el) => el.classList.add("is-in"));
    }, 24);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [toasts]);

  return (
    <div ref={rootRef}>
      {/* Cart */}
      <div
        className={`overlay${panel === "cart" ? " is-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePanel();
        }}
      >
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping bag"
        >
          <div className="sheet__head">
            <h2>Your Bag</h2>
            <button
              className="sheet__close"
              type="button"
              aria-label="Close shopping bag"
              onClick={closePanel}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="sheet__body">
            <CartLines />
          </div>
          {panel === "cart" && (
            <div className="sheet__foot">
              <CartSummary />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div
        className={`overlay overlay--search${panel === "search" ? " is-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePanel();
        }}
      >
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Search the collection"
        >
          <div className="sheet__head">
            <h2>Search</h2>
            <button
              className="sheet__close"
              type="button"
              aria-label="Close search"
              onClick={closePanel}
            >
              <Icon name="close" />
            </button>
          </div>
          {panel === "search" && <SearchOverlay />}
        </div>
      </div>

      {/* Size guide */}
      <div
        className={`overlay overlay--center${panel === "sizeguide" ? " is-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePanel();
        }}
      >
        <div className="modal modal--sm">
          <button
            className="btn btn--outline btn--icon modal__close"
            type="button"
            aria-label="Close size guide"
            onClick={closePanel}
          >
            <Icon name="close" />
          </button>
          {panel === "sizeguide" && <SizeGuide />}
        </div>
      </div>

      {/* Quick view */}
      <div
        className={`overlay overlay--center${quickViewId ? " is-open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeQuickView();
        }}
      >
        <div className="modal">
          <button
            className="btn btn--outline btn--icon modal__close"
            type="button"
            aria-label="Close quick view"
            onClick={closeQuickView}
          >
            <Icon name="close" />
          </button>
          {product && (
            <QuickView key={product.id} product={product} onClose={closeQuickView} />
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.leaving ? " is-leaving" : ""}`}>
            <Icon name={t.icon} aria-hidden="true" />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}