import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, ShoppingBag, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePageMeta } from "../hooks/usePageMeta";

interface OrderDetails {
  id: number;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  createdAt: string;
}

type PageState = "loading" | "success" | "processing" | "failed" | "not_found";

export function OrderConfirmationPage() {
  usePageMeta("Order Confirmation");

  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const paymentIntentStatus = params.get("redirect_status"); // from Stripe redirect

  const [state, setState] = useState<PageState>("loading");
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) { setState("not_found"); return; }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, status, subtotal, shipping_fee, discount_amount, total, coupon_code, created_at")
          .eq("id", Number(orderId))
          .single();

        if (error || !data) { setState("not_found"); return; }

        setOrder({
          id: data.id,
          status: data.status,
          subtotal: Number(data.subtotal),
          shippingFee: Number(data.shipping_fee),
          discountAmount: Number(data.discount_amount),
          total: Number(data.total),
          couponCode: data.coupon_code,
          createdAt: data.created_at,
        });

        // Determine display state
        if (paymentIntentStatus === "failed") {
          setState("failed");
        } else if (data.status === "processing" || data.status === "shipped" || data.status === "delivered") {
          setState("success");
        } else if (data.status === "payment_failed") {
          setState("failed");
        } else {
          // pending_payment — webhook may not have fired yet
          setState("processing");
        }
      } catch {
        setState("not_found");
      }
    };
    load();
  }, [orderId, paymentIntentStatus]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-charcoal-muted" />
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <p className="text-charcoal-muted mb-4">Order not found.</p>
        <Link to="/" className="btn-primary">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-20 flex flex-col items-center text-center gap-8">
      {state === "success" && (
        <>
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-success" />
          </div>
          <div>
            <p className="eyebrow mb-2">Order Confirmed</p>
            <h1 className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] text-charcoal tracking-tight mb-3">
              Thank you for your order!
            </h1>
            <p className="text-charcoal-muted text-sm">
              Your order <span className="font-semibold text-charcoal">#{order?.id}</span> has been placed successfully. We'll send you updates as it ships.
            </p>
          </div>
        </>
      )}

      {state === "processing" && (
        <>
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-gold" />
          </div>
          <div>
            <p className="eyebrow mb-2">Payment Processing</p>
            <h1 className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] text-charcoal tracking-tight mb-3">
              Confirming your payment…
            </h1>
            <p className="text-charcoal-muted text-sm">
              Order <span className="font-semibold text-charcoal">#{order?.id}</span> is being confirmed. This usually takes just a moment. Check your account page for updates.
            </p>
          </div>
        </>
      )}

      {state === "failed" && (
        <>
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
            <AlertCircle size={40} className="text-error" />
          </div>
          <div>
            <p className="eyebrow mb-2">Payment Failed</p>
            <h1 className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] text-charcoal tracking-tight mb-3">
              Something went wrong
            </h1>
            <p className="text-charcoal-muted text-sm">
              Your payment for order <span className="font-semibold text-charcoal">#{order?.id}</span> could not be processed. Please try again or use a different payment method.
            </p>
          </div>
        </>
      )}

      {/* Order details card */}
      {order && (
        <div className="w-full card p-6 text-left flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Package size={16} className="text-charcoal-muted shrink-0" />
            <h2 className="font-serif text-lg text-charcoal">Order Summary</h2>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Order ID</span>
              <span className="text-charcoal font-medium">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Date</span>
              <span className="text-charcoal">
                {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Subtotal</span>
              <span className="text-charcoal">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Shipping</span>
              <span className={order.shippingFee === 0 ? "text-success" : "text-charcoal"}>
                {order.shippingFee === 0 ? "Free" : `$${order.shippingFee.toFixed(2)}`}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-warm-gray pt-2.5 mt-0.5">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="font-serif text-xl text-charcoal">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link to="/account" className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Package size={14} /> View Orders
        </Link>
        <Link to="/" className="btn-outline flex-1 flex items-center justify-center gap-2">
          <ShoppingBag size={14} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
