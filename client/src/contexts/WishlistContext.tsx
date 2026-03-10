import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
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
const GUEST_KEY = "furniture_wishlist_guest";

type ProductRow = {
  id: number; name: string; category: string; price: number; image: string;
  description: string | null; rating: number; review_count: number; stock: number;
  is_featured: boolean; material: string | null; dimensions: string | null; color: string | null;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    description: row.description ?? "",
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    stock: Number(row.stock ?? 0),
    isFeatured: row.is_featured ? 1 : 0,
    material: row.material ?? undefined,
    dimensions: row.dimensions ?? undefined,
    color: row.color ?? undefined,
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServerWishlist = async (): Promise<Product[]> => {
    const { data } = await supabase
      .from("wishlist_items")
      .select("products(*)")
      .eq("user_id", String(user?.id));

    if (!data) return [];
    return data
      .map((row) => row.products as ProductRow | null)
      .filter((p): p is ProductRow => p !== null)
      .map(mapProduct);
  };

  const refreshWishlist = async () => {
    if (!user) {
      const raw = localStorage.getItem(GUEST_KEY);
      setItems(raw ? (JSON.parse(raw) as Product[]) : []);
      return;
    }
    const products = await fetchServerWishlist();
    setItems(products);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        setLoading(true);

        if (!user) {
          const raw = localStorage.getItem(GUEST_KEY);
          if (active) setItems(raw ? (JSON.parse(raw) as Product[]) : []);
          return;
        }

        // Merge guest wishlist into server on sign-in
        const raw = localStorage.getItem(GUEST_KEY);
        const guestItems: Product[] = raw ? (JSON.parse(raw) as Product[]) : [];

        if (guestItems.length > 0) {
          await supabase.from("wishlist_items").upsert(
            guestItems.map((p) => ({ user_id: String(user.id), product_id: p.id })),
            { onConflict: "user_id,product_id" }
          );
          localStorage.removeItem(GUEST_KEY);
        }

        const products = await fetchServerWishlist();
        if (active) setItems(products);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isWishlisted = (productId: number) => items.some((p) => p.id === productId);

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      setItems((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        const next = exists
          ? prev.filter((p) => p.id !== product.id)
          : [product, ...prev.filter((p) => p.id !== product.id)];
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }

    if (isWishlisted(product.id)) {
      await supabase
        .from("wishlist_items")
        .delete()
        .match({ user_id: String(user.id), product_id: product.id });
      setItems((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      await supabase
        .from("wishlist_items")
        .upsert({ user_id: String(user.id), product_id: product.id }, { onConflict: "user_id,product_id" });
      setItems((prev) => [product, ...prev.filter((p) => p.id !== product.id)]);
    }
  };

  const removeWishlist = async (productId: number) => {
    if (!user) {
      setItems((prev) => {
        const next = prev.filter((p) => p.id !== productId);
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    await supabase
      .from("wishlist_items")
      .delete()
      .match({ user_id: String(user.id), product_id: productId });
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <WishlistContext.Provider value={{
      items, loading, wishlistCount: items.length,
      isWishlisted, toggleWishlist, removeWishlist, refreshWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
