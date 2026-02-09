import { HeartOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

export function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { items, loading, removeWishlist } = useWishlist();

  if (loading) {
    return (
      <section className="container section">
        <div className="page-state">Loading your wishlist...</div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="container section">
        <div className="page-state">
          Your wishlist is empty. <Link to="/">Explore products</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Saved Favorites</p>
          <h1>Wishlist</h1>
        </div>
      </div>

      {!user && (
        <div className="page-state">
          You are browsing as guest. <Link to="/login">Sign in</Link> to sync wishlist across devices.
        </div>
      )}

      <div className="wishlist-grid">
        {items.map((product) => (
          <article className="wishlist-card" key={product.id}>
            <Link to={`/product/${product.id}`}>
              <img src={product.image} alt={product.name} className="wishlist-image" />
            </Link>

            <div>
              <p className="category-pill">{product.category}</p>
              <Link to={`/product/${product.id}`} className="wishlist-title">
                {product.name}
              </Link>
              <p>{product.description}</p>
            </div>

            <div className="wishlist-actions">
              <strong>${product.price.toFixed(2)}</strong>
              <button className="btn btn-small" onClick={() => addToCart(product, 1)}>
                Add to Cart
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => removeWishlist(product.id)}
              >
                <HeartOff size={14} /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}