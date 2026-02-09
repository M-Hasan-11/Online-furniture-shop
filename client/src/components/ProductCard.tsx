import { Heart, HeartOff, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import type { Product } from "../lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(product.id);

  return (
    <article className="product-card reveal">
      <Link to={`/product/${product.id}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
      </Link>

      <div className="product-body">
        <div className="product-topline">
          <span className="category-pill">{product.category}</span>
          <span className="rating">
            <Star size={14} /> {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <Link to={`/product/${product.id}`} className="product-title">
          {product.name}
        </Link>

        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <span className="price">${product.price.toFixed(2)}</span>
          <div className="product-actions-inline">
            <button
              className="icon-button"
              onClick={() => void toggleWishlist(product)}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wished ? <HeartOff size={16} /> : <Heart size={16} />}
            </button>
            <button
              className="btn btn-small"
              onClick={() => addToCart(product, 1)}
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? "Sold Out" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
