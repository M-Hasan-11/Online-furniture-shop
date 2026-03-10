import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tag, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { validateCoupon } from "../lib/db";
import { supabase } from "../lib/supabase";
import type { CouponValidation } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";

const FREE_SHIPPING_THRESHOLD = 1000;
const DEFAULT_SHIPPING_FEE = 49;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const STRIPE_APPEARANCE = {
  variables: {
    colorPrimary: "#C9A84C",
    colorBackground: "#FFFFFF",
    colorText: "#1C1C1E",
    colorDanger: "#E53935",
    fontFamily: "Inter, Segoe UI, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #E8E4DF", padding: "12px 16px" },
    ".Input:focus": { border: "1px solid #C9A84C", boxShadow: "0 0 0 3px rgba(201,168,76,0.15)" },
    ".Label": { color: "#5C5C60", fontSize: "13px", fontWeight: "500" },
  },
};

// ── Step 1: Shipping form ─────────────────────────────────────

interface ShippingData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  notes: string;
}

interface Step1Props {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string;
  setCouponCode: (v: string) => void;
  appliedCoupon: CouponValidation | null;
  applyingCoupon: boolean;
  onApplyCoupon: () => void;
  onNext: (data: ShippingData) => void;
  submitting: boolean;
}

function Step1Shipping({
  items, subtotal, shipping, discount, total,
  couponCode, setCouponCode, appliedCoupon, applyingCoupon, onApplyCoupon,
  onNext, submitting,
}: Step1Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ fullName, email, address, city, zip, notes });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h2 className="font-serif text-xl text-charcoal mb-5">Shipping Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input id="fullName" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="address">Street Address</label>
              <input id="address" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="123 Maple Street" />
            </div>
            <div>
              <label className="form-label" htmlFor="city">City</label>
              <input id="city" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="New York" />
            </div>
            <div>
              <label className="form-label" htmlFor="zip">ZIP Code</label>
              <input id="zip" className="form-input" value={zip} onChange={(e) => setZip(e.target.value)} required placeholder="10001" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label" htmlFor="notes">
                Delivery Notes <span className="text-charcoal-light font-normal">(Optional)</span>
              </label>
              <textarea id="notes" className="form-input resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Leave at door, ring bell, etc." />
            </div>
          </div>
        </div>

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
            <button type="button" onClick={onApplyCoupon} disabled={applyingCoupon} className="btn-outline shrink-0 px-5">
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

        <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
          {submitting ? "Preparing payment…" : `Continue to Payment — $${total.toFixed(2)}`}
        </button>
      </form>

      <OrderSummary items={items} subtotal={subtotal} shipping={shipping} discount={discount} total={total} />
    </div>
  );
}

// ── Step 2: Stripe payment form ───────────────────────────────

interface PaymentFormProps {
  total: number;
  onBack: () => void;
}

function PaymentForm({ total, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setPaying(true);
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (error) {
        toast.error(error.message ?? "Payment failed. Please try again.");
      }
      // On success, Stripe redirects to /order-confirmation?payment_intent=...
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl text-charcoal mb-5">Payment</h2>
        <PaymentElement />
      </div>

      <div className="flex items-center gap-2 text-xs text-charcoal-muted">
        <Lock size={12} className="text-charcoal-light shrink-0" />
        <span>Your payment is secured by Stripe. We never store your card details.</span>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <button type="submit" disabled={paying || !stripe} className="btn-primary flex-1">
          {paying ? "Processing…" : `Pay $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

// ── Order summary sidebar ─────────────────────────────────────

function OrderSummary({
  items, subtotal, shipping, discount, total,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}) {
  return (
    <aside
      className="sticky top-28 bg-white rounded-2xl border border-warm-gray p-6 flex flex-col gap-4"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <h2 className="font-serif text-xl text-charcoal">Your Items</h2>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover bg-stone shrink-0" />
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
  );
}

// ── Main page ─────────────────────────────────────────────────

export function CheckoutPage() {
  usePageMeta("Checkout");

  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = useMemo(() => Math.max(0, subtotal + shippingFee - discount), [discount, shippingFee, subtotal]);

  // Suppress unused variable warning — user is accessed via auth context for session
  void user;

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

  const handleShippingNext = async (data: ShippingData) => {
    if (items.length === 0) { toast.error("Your cart is empty."); return; }
    try {
      setSubmitting(true);
      const shippingAddress = `${data.fullName}, ${data.email}, ${data.address}, ${data.city}, ${data.zip}${data.notes ? `. Notes: ${data.notes}` : ""}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in to continue."); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
            shippingAddress,
            couponCode: couponCode.trim() || undefined,
          }),
        }
      );

      const result = await res.json() as { clientSecret?: string; orderId?: number; error?: string };
      if (!res.ok || result.error) throw new Error(result.error ?? "Failed to initialize payment");

      setClientSecret(result.clientSecret!);
      clearCart();
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Header + step indicator */}
      <div className="mb-10">
        <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-charcoal tracking-tight">
          Checkout
        </h1>
        <div className="flex items-center gap-3 mt-4">
          {([{ n: 1, label: "Shipping" }, { n: 2, label: "Payment" }] as const).map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-3">
              {i > 0 && <div className="w-8 h-px bg-warm-gray" />}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= n ? "bg-charcoal text-warm-white" : "bg-stone text-charcoal-muted border border-warm-gray"}`}>
                  {n}
                </div>
                <span className={`text-sm ${step >= n ? "text-charcoal font-medium" : "text-charcoal-muted"}`}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Step1Shipping
          items={items}
          subtotal={subtotal}
          shipping={shippingFee}
          discount={discount}
          total={total}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          appliedCoupon={appliedCoupon}
          applyingCoupon={applyingCoupon}
          onApplyCoupon={applyCoupon}
          onNext={handleShippingNext}
          submitting={submitting}
        />
      )}

      {step === 2 && clientSecret && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-10 items-start">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <PaymentForm
              total={total}
              onBack={() => setStep(1)}
            />
          </Elements>
          <OrderSummary items={items} subtotal={subtotal} shipping={shippingFee} discount={discount} total={total} />
        </div>
      )}
    </div>
  );
}
