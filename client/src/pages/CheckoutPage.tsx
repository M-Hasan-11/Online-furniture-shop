import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import api from "../lib/api";
import type { CouponValidation } from "../lib/types";

const FREE_SHIPPING_THRESHOLD = 1000;
const DEFAULT_SHIPPING_FEE = 49;

function extractApiMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponNotice, setCouponNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = useMemo(
    () => Math.max(0, subtotal + shipping - discount),
    [discount, shipping, subtotal]
  );

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponNotice("Enter a coupon code first.");
      setAppliedCoupon(null);
      return;
    }

    if (subtotal <= 0) {
      setCouponNotice("Add items to your cart before applying a coupon.");
      setAppliedCoupon(null);
      return;
    }

    try {
      setApplyingCoupon(true);
      setCouponNotice(null);
      const { data } = await api.get<CouponValidation>("/coupons/validate", {
        params: {
          code: couponCode.trim(),
          subtotal,
        },
      });

      setAppliedCoupon(data);
      setCouponCode(data.coupon.code);
      setCouponNotice(`Applied ${data.coupon.code}: -$${data.discountAmount.toFixed(2)}`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponNotice(extractApiMessage(err, "Could not apply coupon."));
    } finally {
      setApplyingCoupon(false);
    }
  };

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
        couponCode: couponCode.trim() || undefined,
      });

      clearCart();
      navigate("/account", { replace: true });
    } catch (err) {
      setError(extractApiMessage(err, "Checkout failed. Please verify your details and try again."));
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

        <div className="coupon-row">
          <input
            placeholder="Coupon code"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          />
          <button
            className="btn btn-secondary"
            type="button"
            onClick={applyCoupon}
            disabled={applyingCoupon}
          >
            {applyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>

        {couponNotice && (
          <p className={appliedCoupon ? "coupon-success" : "form-error"}>{couponNotice}</p>
        )}

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
        <p>
          <span>Discount</span>
          <strong>{discount > 0 ? `-$${discount.toFixed(2)}` : "$0.00"}</strong>
        </p>
        {appliedCoupon && (
          <p>
            <span>Coupon</span>
            <strong>{appliedCoupon.coupon.code}</strong>
          </p>
        )}
        <p className="summary-total">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </p>
      </aside>
    </section>
  );
}