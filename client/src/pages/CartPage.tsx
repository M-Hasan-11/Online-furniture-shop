import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export function CartPage() {
  const { items, subtotal, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shipping = subtotal > 1000 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <section className="container section">
        <div className="page-state">
          Your cart is empty. <Link to="/">Browse furniture</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section cart-layout">
      <div>
        <h1>Shopping Cart</h1>
        <div className="cart-list">
          {items.map((item) => (
            <article className="cart-item" key={item.product.id}>
              <img src={item.product.image} alt={item.product.name} />

              <div>
                <Link to={`/product/${item.product.id}`} className="cart-title">
                  {item.product.name}
                </Link>
                <p>${item.product.price.toFixed(2)} each</p>

                <div className="qty-wrap">
                  <button
                    className="icon-button"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="icon-button"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="cart-right">
                <strong>${(item.product.price * item.quantity).toFixed(2)}</strong>
                <button
                  className="icon-button"
                  onClick={() => removeFromCart(item.product.id)}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="order-summary">
        <h2>Summary</h2>
        <p>
          <span>Subtotal</span>
          <strong>${subtotal.toFixed(2)}</strong>
        </p>
        <p>
          <span>Shipping</span>
          <strong>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</strong>
        </p>
        <p className="summary-total">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </p>

        <button className="btn" onClick={() => navigate(user ? "/checkout" : "/login")}>Checkout</button>
      </aside>
    </section>
  );
}