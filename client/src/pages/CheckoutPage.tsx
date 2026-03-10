import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tag, CheckCircle2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { validateCoupon, createOrder } from "../lib/db";
import type { CouponValidation } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";

const FREE_SHIPPING_THRESHOLD = 1000;
const DEFAULT_SHIPPING_FEE = 49;

export function CheckoutPage() {
  usePageMeta("Checkout");

  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = useMemo(() => Math.max(0, subtotal + shipping - discount), [discount, shipping, subtotal]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error("Enter a coupon code first."); return; }
    if (subtotal <= 0) { toast.error("Add items to your cart first."); return; }
    try {
      setApplyingCoupon(true);
      const data = await validateCoupon(couponCode.trim(), subtotal);
      setAppliedCoupon(data);
      setCouponCode(data.coupon.code);
      toast.success(`Coupon applied: -$${data.discountAmount.toFixed(2)}`);
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(err instanceof Error ? err.message : "Could not apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty."); return; }
    try {
      setSubmitting(true);
      const shippingAddress = `${fullName}, ${email}, ${address}, ${city}, ${zip}${notes ? `. Notes: ${notes}` : ""}`;
      await createOrder({
        userId: String(user!.id),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress,
        couponCode: couponCode.trim() || undefined,
      });
      clearCart();
      toast.success("Order placed successfully!");
      navigate("/account", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-charcoal tracking-tight mb-10">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
        {/* Shipping form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-xl text-charcoal mb-5">Shipping Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="address">Street Address</label>
                <input
                  id="address"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="123 Maple Street"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="city">City</label>
                <input
                  id="city"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="zip">ZIP Code</label>
                <input
                  id="zip"
                  className="form-input"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                  placeholder="10001"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="notes">Delivery Notes <span className="text-charcoal-light font-normal">(Optional)</span></label>
                <textarea
                  id="notes"
                  className="form-input resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Leave at door, ring bell, etc."
                />
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div>
            <h2 className="font-serif text-xl text-charcoal mb-4">Promo Code</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
                <input
                  className="form-input pl-9"
                  placeholder="Enter promo code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
              <button type="button" onClick={applyCoupon} disabled={applyingCoupon} className="btn-outline shrink-0 px-5">
                {applyingCoupon ? "Applying…" : "Apply"}
              </button>
            </div>
            {appliedCoupon && (
              <div className="flex items-center gap-2 mt-2 text-sm text-success">
                <CheckCircle2 size={14} />
                <span>{appliedCoupon.coupon.code}: -{`$${appliedCoupon.discountAmount.toFixed(2)}`} discount applied</span>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Placing Order…" : `Place Order — $${total.toFixed(2)}`}
          </button>
        </form>

        {/* Order summary sidebar */}
        <aside className="sticky top-28 bg-white rounded-2xl border border-warm-gray p-6 flex flex-col gap-4"
          style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-serif text-xl text-charcoal">Your Items</h2>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-lg object-cover bg-stone shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-charcoal truncate">{item.product.name}</p>
                  <p className="text-xs text-charcoal-muted">×{item.quantity}</p>
                </div>
                <span className="text-xs font-medium text-charcoal shrink-0">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 text-sm border-t border-warm-gray pt-4">
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Subtotal</span>
              <span className="text-charcoal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Shipping</span>
              <span className={shipping === 0 ? "text-success" : "text-charcoal"}>
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-warm-gray">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="font-serif text-xl text-charcoal">${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
