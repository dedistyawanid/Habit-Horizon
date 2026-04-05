import { useState, useCallback } from "react";
import { WishlistItem } from "@/types/wishlist";

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
    update([...load(), newItem]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateWishlistItem = useCallback((id: string, updates: Partial<Omit<WishlistItem, "id" | "createdAt">>) => {
    const items = load().map((w) => w.id === id ? { ...w, ...updates } : w);
    update(items);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteWishlistItem = useCallback((id: string) => {
    update(load().filter((w) => w.id !== id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addWishlistSavings = useCallback((id: string, amount: number) => {
    const items = load().map((w) =>
      w.id === id ? { ...w, currentAmount: Math.min(w.currentAmount + amount, w.targetAmount) } : w
    );
    update(items);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { wishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, addWishlistSavings };
}
