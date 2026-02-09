import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import api from "../lib/api";

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal > 1000 ? 0 : 49;
  const total = useMemo(() => subtotal + shipping, [shipping, subtotal]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const shippingAddress = `${fullName}, ${email}, ${address}, ${city}, ${zip}. Notes: ${notes || "None"}`;

      await api.post("/orders", {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress,
      });

      clearCart();
      navigate("/account", { replace: true });
    } catch {
      setError("Checkout failed. Please verify your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section cart-layout">
      <form className="checkout-form reveal" onSubmit={onSubmit}>
        <h1>Checkout</h1>

        <label>
          Full Name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Street Address
          <input value={address} onChange={(event) => setAddress(event.target.value)} required />
        </label>

        <label>
          City
          <input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>

        <label>
          ZIP Code
          <input value={zip} onChange={(event) => setZip(event.target.value)} required />
        </label>

        <label>
          Delivery Notes (Optional)
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Placing order..." : `Place Order - $${total.toFixed(2)}`}
        </button>
      </form>

      <aside className="order-summary reveal">
        <h2>Your Items</h2>
        {items.map((item) => (
          <p key={item.product.id}>
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <strong>${(item.product.price * item.quantity).toFixed(2)}</strong>
          </p>
        ))}

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
      </aside>
    </section>
  );
}