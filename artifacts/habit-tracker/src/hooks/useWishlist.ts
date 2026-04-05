import { useState, useCallback, useEffect } from "react";
import { WishlistItem } from "@/types/wishlist";
import {
  syncWishlistItem,
  deleteWishlistItem as dbDeleteWishlistItem,
} from "@/lib/sync";

const KEY = "dedi_wishlist";

function load(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(items: WishlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(load);

  /* Re-hydrate from localStorage when cloud sync writes data (storage event) */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY && e.newValue) {
        try { setWishlist(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function update(items: WishlistItem[]) {
    setWishlist(items);
    save(items);
  }

  const addWishlistItem = useCallback((item: Omit<WishlistItem, "id" | "createdAt">) => {
    const newItem: WishlistItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const items = [...load(), newItem];
    update(items);
    syncWishlistItem({
      id: newItem.id, title: newItem.title,
      targetAmount: newItem.targetAmount, currentAmount: newItem.currentAmount,
      imageUrl: newItem.imageUrl, createdAt: newItem.createdAt,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateWishlistItem = useCallback((id: string, updates: Partial<Omit<WishlistItem, "id" | "createdAt">>) => {
    const items = load().map((w) => w.id === id ? { ...w, ...updates } : w);
    update(items);
    const found = items.find((w) => w.id === id);
    if (found) syncWishlistItem({
      id: found.id, title: found.title,
      targetAmount: found.targetAmount, currentAmount: found.currentAmount,
      imageUrl: found.imageUrl, createdAt: found.createdAt,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteWishlistItem = useCallback((id: string) => {
    update(load().filter((w) => w.id !== id));
    dbDeleteWishlistItem(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addWishlistSavings = useCallback((id: string, amount: number) => {
    const items = load().map((w) =>
      w.id === id ? { ...w, currentAmount: Math.min(w.currentAmount + amount, w.targetAmount) } : w
    );
    update(items);
    const found = items.find((w) => w.id === id);
    if (found) syncWishlistItem({
      id: found.id, title: found.title,
      targetAmount: found.targetAmount, currentAmount: found.currentAmount,
      imageUrl: found.imageUrl, createdAt: found.createdAt,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { wishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, addWishlistSavings };
}
