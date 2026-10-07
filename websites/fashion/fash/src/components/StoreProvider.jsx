"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}

const CART_KEY = "fash:cart";
const SAVED_KEY = "fash:saved";
let toastSeq = 0;

export default function StoreProvider({ children }) {
  const [items, setItems] = useState([]);
  const [saved, setSaved] = useState([]);
  const [panel, setPanel] = useState(null); // 'cart' | 'search' | 'sizeguide'
  const [quickViewId, setQuickViewId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      const list = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(cart)) setItems(cart);
      if (Array.isArray(list)) setSaved(list);
    } catch {
      /* storage unavailable — start empty */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {}
  }, [saved]);

  const toast = useCallback((text, icon = "check") => {
    const id = ++toastSeq;
    setToasts((list) => [...list.slice(-2), { id, text, icon }]);
    window.setTimeout(() => {
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
    }, 2400);
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 2750);
  }, []);

  const addItem = useCallback(
    (product, size = "M") => {
      setItems((list) => {
        const hit = list.find((i) => i.id === product.id);
        if (hit) {
          return list.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + 1, size } : i,
          );
        }
        return [...list, { id: product.id, qty: 1, size }];
      });
      toast(`${product.name} added to your bag`, "check");
    },
    [toast],
  );

  const setQty = useCallback((id, qty) => {
    setItems((list) =>
      qty <= 0
        ? list.filter((i) => i.id !== id)
        : list.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((list) => list.filter((i) => i.id !== id));
  }, []);

  const toggleSaved = useCallback(
    (product) => {
      setSaved((list) => {
        const has = list.includes(product.id);
        toast(
          has ? `${product.name} removed from saved` : `${product.name} saved`,
          "heart",
        );
        return has
          ? list.filter((id) => id !== product.id)
          : [...list, product.id];
      });
    },
    [toast],
  );

  const openPanel = useCallback((name) => {
    setQuickViewId(null);
    setPanel(name);
  }, []);
  const closePanel = useCallback(() => setPanel(null), []);
  const openQuickView = useCallback((id) => {
    setPanel(null);
    setQuickViewId(id);
  }, []);
  const closeQuickView = useCallback(() => setQuickViewId(null), []);

  const value = useMemo(
    () => ({
      items,
      saved,
      panel,
      quickViewId,
      toasts,
      toast,
      addItem,
      setQty,
      removeItem,
      toggleSaved,
      openPanel,
      closePanel,
      openQuickView,
      closeQuickView,
    }),
    [
      items,
      saved,
      panel,
      quickViewId,
      toasts,
      toast,
      addItem,
      setQty,
      removeItem,
      toggleSaved,
      openPanel,
      closePanel,
      openQuickView,
      closeQuickView,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
