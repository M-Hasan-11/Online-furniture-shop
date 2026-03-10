import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { usePageMeta } from "../hooks/usePageMeta";

export function CartPage() {
  usePageMeta("Cart");

  const { items, subtotal, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shipping = subtotal > 1000 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="section flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-stone flex items-center justify-center">
          <ShoppingBag size={24} className="text-charcoal-light" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">Your cart is empty</h2>
          <p className="text-sm text-charcoal-muted">Add some beautiful pieces to get started.</p>
        </div>
        <Link to="/" className="btn-primary">Browse Furniture</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-charcoal tracking-tight mb-10">
        Shopping Cart
        <span className="ml-3 font-sans text-base font-normal text-charcoal-muted">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
        {/* Cart items */}
        <div className="flex flex-col divide-y divide-warm-gray">
          {items.map((item) => (
            <article key={item.product.id} className="flex gap-5 py-6 first:pt-0">
              {/* Image */}
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 rounded-xl object-cover bg-stone hover:opacity-90 transition-opacity"
                />
              </Link>

              {/* Details */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <Link
                  to={`/product/${item.product.id}`}
                  className="font-serif text-base text-charcoal hover:text-gold transition-colors leading-snug line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="text-xs text-charcoal-muted">${item.product.price.toFixed(2)} each</p>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-warm-gray flex items-center justify-center text-charcoal-muted hover:border-charcoal hover:text-charcoal transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-medium text-charcoal w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-7 h-7 rounded-full border border-warm-gray flex items-center justify-center text-charcoal-muted hover:border-charcoal hover:text-charcoal transition-all disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Price + remove */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <span className="font-serif text-lg text-charcoal">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-charcoal-light hover:text-error hover:bg-red-50 transition-all"
                  aria-label="Remove item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Order summary */}
        <aside className="sticky top-28 bg-white rounded-2xl border border-warm-gray p-6 flex flex-col gap-4"
          style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-serif text-xl text-charcoal">Order Summary</h2>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Subtotal</span>
              <span className="font-medium text-charcoal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Shipping</span>
              <span className={`font-medium ${shipping === 0 ? "text-success" : "text-charcoal"}`}>
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {subtotal <= 1000 && subtotal > 0 && (
              <p className="text-xs text-charcoal-muted bg-stone rounded-lg p-2.5">
                Add ${(1000 - subtotal).toFixed(2)} more for free shipping.
              </p>
            )}
            <div className="flex justify-between pt-3 border-t border-warm-gray">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="font-serif text-xl text-charcoal">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate(user ? "/checkout" : "/login")}
            className="btn-primary w-full mt-1"
          >
            {user ? "Proceed to Checkout" : "Sign in to Checkout"}
            <ArrowRight size={15} />
          </button>

          <Link to="/" className="text-xs text-center text-charcoal-muted hover:text-charcoal transition-colors">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
