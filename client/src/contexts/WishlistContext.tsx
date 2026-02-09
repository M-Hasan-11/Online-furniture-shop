import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import api from "../lib/api";
import type { Product } from "../lib/types";

interface WishlistContextValue {
  items: Product[];
  loading: boolean;
  wishlistCount: number;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const GUEST_STORAGE_KEY = "furniture_wishlist_guest";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshWishlist = async () => {
    if (!user) {
      const guestItemsRaw = localStorage.getItem(GUEST_STORAGE_KEY);
      const guestItems = guestItemsRaw ? (JSON.parse(guestItemsRaw) as Product[]) : [];
      setItems(guestItems);
      return;
    }

    const { data } = await api.get<{ products: Product[] }>("/wishlist");
    setItems(data.products);
  };

  useEffect(() => {
    let active = true;

    const bootstrapWishlist = async () => {
      try {
        setLoading(true);

        if (!user) {
          const guestItemsRaw = localStorage.getItem(GUEST_STORAGE_KEY);
          const guestItems = guestItemsRaw ? (JSON.parse(guestItemsRaw) as Product[]) : [];
          if (active) {
            setItems(guestItems);
          }
          return;
        }

        const guestItemsRaw = localStorage.getItem(GUEST_STORAGE_KEY);
        const guestItems = guestItemsRaw ? (JSON.parse(guestItemsRaw) as Product[]) : [];

        if (guestItems.length > 0) {
          for (const product of guestItems) {
            try {
              await api.post(`/wishlist/${product.id}`);
            } catch {
              // Ignore individual merge failures and continue with server sync.
            }
          }
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }

        const { data } = await api.get<{ products: Product[] }>("/wishlist");
        if (active) {
          setItems(data.products);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrapWishlist();

    return () => {
      active = false;
    };
  }, [user]);

  const isWishlisted = (productId: number) => items.some((item) => item.id === productId);

  const toggleWishlist = async (product: Product) => {
    if (user) {
      const exists = isWishlisted(product.id);
      if (exists) {
        await api.delete(`/wishlist/${product.id}`);
        setItems((prev) => prev.filter((item) => item.id !== product.id));
      } else {
        const { data } = await api.post<{ product: Product }>(`/wishlist/${product.id}`);
        setItems((prev) => [data.product, ...prev.filter((item) => item.id !== product.id)]);
      }
      return;
    }

    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      const next = exists
        ? prev.filter((item) => item.id !== product.id)
        : [product, ...prev.filter((item) => item.id !== product.id)];
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeWishlist = async (productId: number) => {
    if (user) {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }

    setItems((prev) => {
      const next = prev.filter((item) => item.id !== productId);
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = {
    items,
    loading,
    wishlistCount: items.length,
    isWishlisted,
    toggleWishlist,
    removeWishlist,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
