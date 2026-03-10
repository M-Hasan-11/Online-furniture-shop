import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify caller is a logged-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { items, shippingAddress, couponCode } = await req.json() as {
      items: { productId: number; quantity: number }[];
      shippingAddress: string;
      couponCode?: string;
    };

    if (!items?.length) return json({ error: "Cart is empty" }, 400);

    // Fetch server-side prices (never trust client)
    const productIds = items.map((i) => i.productId);
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);

    if (prodErr || !products) return json({ error: "Failed to fetch products" }, 500);

    // Validate stock and compute subtotal
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return json({ error: `Product ${item.productId} not found` }, 400);
      if (product.stock < item.quantity) return json({ error: `Insufficient stock for ${product.name}` }, 400);
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    const FREE_SHIPPING_THRESHOLD = 1000;
    const DEFAULT_SHIPPING_FEE = 49;
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;

    // Validate coupon server-side
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;

    if (couponCode?.trim()) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon && subtotal >= coupon.min_order_amount) {
        const expires = coupon.expires_at ? new Date(coupon.expires_at) : null;
        if (!expires || expires > new Date()) {
          discountAmount = coupon.discount_type === "percent"
            ? (subtotal * coupon.discount_value) / 100
            : Math.min(coupon.discount_value, subtotal);
          validatedCouponCode = coupon.code;
        }
      }
    }

    const total = Math.max(0, subtotal + shippingFee - discountAmount);
    const totalCents = Math.round(total * 100);

    if (totalCents < 50) return json({ error: "Order total too low" }, 400);

    // Create pending order in DB
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        shipping_address: shippingAddress,
        coupon_code: validatedCouponCode,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        total,
        status: "pending_payment",
      })
      .select()
      .single();

    if (orderErr || !order) return json({ error: "Failed to create order" }, 500);

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: products.find((p) => p.id === item.productId)!.price,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Create Stripe PaymentIntent
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      metadata: { orderId: String(order.id), userId: user.id },
    });

    // Store paymentIntentId on order for webhook reconciliation
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    return json({ clientSecret: paymentIntent.client_secret, orderId: order.id });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
