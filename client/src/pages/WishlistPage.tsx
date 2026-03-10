import { Heart, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";
import { ProductCard } from "../components/ProductCard";
import { usePageMeta } from "../hooks/usePageMeta";

export function WishlistPage() {
  usePageMeta("Wishlist");

  const { user } = useAuth();
  const { items, loading } = useWishlist();

  if (loading) {
    return (
      <div className="section">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex flex-col gap-3">
              <div className="skeleton aspect-[4/5] rounded-2xl" />
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-stone flex items-center justify-center">
          <Heart size={24} className="text-charcoal-light" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-charcoal-muted">Save pieces you love to find them easily later.</p>
        </div>
        <Link to="/" className="btn-primary">Browse Collection</Link>
      </div>
    );
  }

  return (
    <div className="section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow mb-1">Saved Favorites</p>
          <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-charcoal tracking-tight">
            Wishlist
            <span className="ml-3 font-sans text-base font-normal text-charcoal-muted">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </h1>
        </div>
        {!user && (
          <div className="flex items-center gap-2 text-sm text-charcoal-muted bg-stone rounded-xl px-4 py-2.5">
            <LinkIcon size={13} />
            <span>
              <Link to="/login" className="text-gold hover:underline font-medium">Sign in</Link>{" "}
              to sync across devices
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
