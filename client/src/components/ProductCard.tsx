import { Heart, HeartOff, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import type { Product } from "../lib/types";
import { cn } from "../lib/cn";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(product.id);

  return (
    <article className="group flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone rounded-2xl">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.82,0.23,1)] group-hover:scale-105"
          />
        </Link>
        {/* Wishlist button */}
        <button
          onClick={() => void toggleWishlist(product)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
            wished
              ? "bg-gold text-white"
              : "bg-white/90 text-charcoal-muted hover:bg-white hover:text-gold backdrop-blur-sm"
          )}
        >
          {wished ? <HeartOff size={14} /> : <Heart size={14} />}
        </button>
        {/* Out of stock overlay */}
        {product.stock < 1 && (
          <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center rounded-2xl">
            <span className="text-white text-xs font-semibold uppercase tracking-wider bg-charcoal/70 px-3 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pt-4 px-0.5 flex flex-col gap-2 flex-1">
        {/* Category + rating row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold border border-gold/30 rounded-full px-2.5 py-0.5">
            {product.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-charcoal-muted">
            <Star size={11} className="fill-gold text-gold" />
            {product.rating.toFixed(1)}
            <span className="text-charcoal-light">({product.reviewCount})</span>
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.id}`}
          className="font-serif text-base text-charcoal leading-snug hover:text-gold transition-colors line-clamp-2"
        >
          {product.name}
        </Link>

        {/* Description */}
        <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1 mt-auto">
          <span className="font-serif text-xl text-charcoal">${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stock < 1}
            className="bg-charcoal text-[#FAFAF8] text-xs font-medium px-4 py-2 rounded-full
                       hover:bg-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {product.stock < 1 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
