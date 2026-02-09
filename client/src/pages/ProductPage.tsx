import { Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import api from "../lib/api";
import type { Product } from "../lib/types";

export function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get<{ product: Product }>(`/products/${id}`);
        setProduct(data.product);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return <div className="container page-state">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="container page-state error">
        {error || "Product unavailable."} <Link to="/">Back to shop</Link>
      </div>
    );
  }

  const addToCartAction = () => {
    addToCart(product, quantity);
  };

  return (
    <section className="container section">
      <div className="product-detail reveal">
        <img src={product.image} alt={product.name} className="detail-image" />

        <div>
          <span className="category-pill">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">${product.price.toFixed(2)}</p>
          <p className="detail-copy">{product.description}</p>

          <div className="detail-meta">
            <div>
              <span>Rating</span>
              <strong>
                <Star size={14} /> {product.rating.toFixed(1)}
              </strong>
            </div>
            <div>
              <span>Material</span>
              <strong>{product.material || "Premium composite"}</strong>
            </div>
            <div>
              <span>Dimensions</span>
              <strong>{product.dimensions || "See description"}</strong>
            </div>
            <div>
              <span>Color</span>
              <strong>{product.color || "Neutral"}</strong>
            </div>
          </div>

          <div className="qty-wrap">
            <button
              className="icon-button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button
              className="icon-button"
              onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <button className="btn" onClick={addToCartAction} disabled={product.stock < 1}>
            {product.stock < 1 ? "Out of stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </section>
  );
}