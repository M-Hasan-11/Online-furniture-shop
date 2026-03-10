/**
 * Supabase data access helpers — replaces Express/Axios API calls.
 * All functions throw on error so callers can use try/catch as before.
 */

import { supabase } from "./supabase";
import type {
  Product, Order, AdminOrder, AdminSummary, Coupon, CouponValidation,
} from "./types";

// ── Type mapping helpers ────────────────────────────────────

type ProductRow = {
  id: number; name: string; category: string; price: number; image: string;
  description: string | null; rating: number; review_count: number; stock: number;
  is_featured: boolean; material: string | null; dimensions: string | null; color: string | null;
  created_at: string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id, name: row.name, category: row.category, price: Number(row.price),
    image: row.image, description: row.description ?? "", rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0), stock: Number(row.stock ?? 0),
    isFeatured: row.is_featured ? 1 : 0, material: row.material ?? undefined,
    dimensions: row.dimensions ?? undefined, color: row.color ?? undefined,
  };
}

function throw_(msg: string): never { throw new Error(msg); }
function dbErr(error: { message: string } | null, msg: string) { if (error) throw_(error.message || msg); }

// ── Products ────────────────────────────────────────────────

export type ProductFilters = {
  category?: string;
  sort?: string;
  search?: string;
};

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from("products").select("*");

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  switch (filters.sort) {
    case "price_asc":  query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "rating":     query = query.order("rating", { ascending: false }); break;
    case "newest":     query = query.order("created_at", { ascending: false }); break;
    default:           query = query.order("is_featured", { ascending: false }).order("id", { ascending: false });
  }

  const { data, error } = await query;
  dbErr(error, "Failed to load products.");
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProduct(id: number): Promise<Product> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  dbErr(error, "Product not found.");
  return mapProduct(data as ProductRow);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .limit(limit);
  dbErr(error, "Failed to load featured products.");
  return (data as ProductRow[]).map(mapProduct);
}

export async function getRecommendations(userId?: string): Promise<{ products: Product[]; reason: string }> {
  if (userId) {
    // Find categories the user has ordered before
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("products(category)")
      .eq("orders.user_id", userId)
      .limit(20);

    const categories = [...new Set(
      (orderItems ?? []).map((oi) => (oi.products as { category: string } | null)?.category).filter(Boolean)
    )] as string[];

    if (categories.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("category", categories)
        .order("rating", { ascending: false })
        .limit(4);
      if (data && data.length > 0) {
        return {
          products: (data as ProductRow[]).map(mapProduct),
          reason: `Based on your past orders in ${categories.slice(0,2).join(" & ")}`,
        };
      }
    }
  }

  // Fallback: top-rated products
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("rating", { ascending: false })
    .limit(4);
  return {
    products: (data as ProductRow[] ?? []).map(mapProduct),
    reason: "Top-rated picks for your home",
  };
}

// ── Reviews ─────────────────────────────────────────────────

export type ReviewRow = {
  id: number; product_id: number; user_id: string; rating: number;
  comment: string | null; created_at: string;
  profiles: { name: string | null } | null;
};

export type Review = {
  id: number; productId: number; userId: number; userName: string;
  rating: number; comment: string; createdAt: string;
};

export async function getReviews(productId: number): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  dbErr(error, "Failed to load reviews.");
  return (data as ReviewRow[]).map((r) => ({
    id: r.id, productId: r.product_id,
    userId: r.user_id as unknown as number,
    userName: r.profiles?.name ?? "Anonymous",
    rating: r.rating, comment: r.comment ?? "",
    createdAt: r.created_at,
  }));
}

export async function upsertReview(
  productId: number, userId: string, rating: number, comment: string
): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .upsert({ product_id: productId, user_id: userId, rating, comment }, { onConflict: "product_id,user_id" })
    .select("*, profiles(name)")
    .single();

  dbErr(error, "Failed to submit review.");
  const r = data as ReviewRow;
  return {
    id: r.id, productId: r.product_id, userId: r.user_id as unknown as number,
    userName: r.profiles?.name ?? "Anonymous", rating: r.rating,
    comment: r.comment ?? "", createdAt: r.created_at,
  };
}

// ── Orders ───────────────────────────────────────────────────

export type CreateOrderInput = {
  userId: string;
  items: Array<{ productId: number; quantity: number }>;
  shippingAddress: string;
  couponCode?: string;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // 1. Fetch prices server-side (never trust client amounts)
  const productIds = input.items.map((i) => i.productId);
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, price, stock")
    .in("id", productIds);
  dbErr(pErr, "Failed to fetch products for order.");

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // 2. Validate stock
  for (const item of input.items) {
    const p = productMap.get(item.productId);
    if (!p || p.stock < item.quantity) throw_(
      `${p?.id ?? item.productId} is out of stock or insufficient quantity.`
    );
  }

  const subtotal = input.items.reduce((sum, item) => {
    return sum + Number(productMap.get(item.productId)!.price) * item.quantity;
  }, 0);

  const shipping = subtotal >= 1000 ? 0 : 49;

  // 3. Validate coupon
  let discountAmount = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const { data: couponResult } = await supabase
      .rpc("validate_coupon", { coupon_code: input.couponCode, order_subtotal: subtotal });
    const result = Array.isArray(couponResult) ? couponResult[0] : couponResult;
    if (result?.valid) {
      discountAmount = Number(result.discount_amount ?? 0);
      couponCode = input.couponCode;
    }
  }

  const total = Math.max(0, subtotal + shipping - discountAmount);

  // 4. Insert order
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      subtotal, shipping_fee: shipping, discount_amount: discountAmount,
      coupon_code: couponCode ?? null, total,
      status: "processing", shipping_address: input.shippingAddress,
    })
    .select()
    .single();
  dbErr(oErr, "Failed to create order.");

  // 5. Insert order items
  const orderItems = input.items.map((item) => ({
    order_id: (order as { id: number }).id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: Number(productMap.get(item.productId)!.price),
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
  dbErr(itemsErr, "Failed to save order items.");

  const o = order as {
    id: number; subtotal: number; shipping_fee: number; discount_amount: number;
    coupon_code: string | null; total: number; status: string;
    shipping_address: string; created_at: string;
  };

  return {
    id: o.id, subtotal: o.subtotal, shippingFee: o.shipping_fee,
    discountAmount: o.discount_amount, couponCode: o.coupon_code,
    total: o.total, status: o.status, shippingAddress: o.shipping_address,
    createdAt: o.created_at, itemCount: input.items.length,
  };
}

export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  dbErr(error, "Failed to load orders.");

  return (data ?? []).map((o) => {
    const itemCount = Array.isArray(o.order_items)
      ? (o.order_items[0] as { count: number })?.count ?? 0
      : 0;
    return {
      id: o.id, subtotal: Number(o.subtotal), shippingFee: Number(o.shipping_fee),
      discountAmount: Number(o.discount_amount), couponCode: o.coupon_code,
      total: Number(o.total), status: o.status, shippingAddress: o.shipping_address,
      createdAt: o.created_at, itemCount: Number(itemCount),
    };
  });
}

// ── Coupon validation ────────────────────────────────────────

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const { data, error } = await supabase
    .rpc("validate_coupon", { coupon_code: code, order_subtotal: subtotal });

  if (error) throw_(error.message || "Could not validate coupon.");

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.valid) throw_(result?.message || "Invalid coupon.");

  // Fetch full coupon row for the CouponValidation shape
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", result.coupon_id)
    .single();

  if (!coupon) throw_("Coupon not found.");

  return {
    coupon: {
      id: coupon.id, code: coupon.code, description: coupon.description,
      discountType: coupon.discount_type, discountValue: Number(coupon.discount_value),
      minOrderAmount: Number(coupon.min_order_amount), isActive: coupon.is_active,
      expiresAt: coupon.expires_at, createdAt: coupon.created_at,
    },
    discountAmount: Number(result.discount_amount),
  };
}

// ── Admin ────────────────────────────────────────────────────

export async function getAdminSummary(): Promise<{ summary: AdminSummary; recentOrders: AdminOrder[] }> {
  const [usersRes, productsRes, couponsRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id, stock", { count: "exact" }),
    supabase.from("coupons").select("id, is_active", { count: "exact" }),
    supabase.from("admin_order_details").select("*").order("created_at", { ascending: false }),
  ]);

  const products = (productsRes.data ?? []) as { id: number; stock: number }[];
  const coupons  = (couponsRes.data  ?? []) as { id: number; is_active: boolean }[];
  const orders   = (ordersRes.data   ?? []) as AdminOrder[];

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const summary: AdminSummary = {
    userCount:        usersRes.count ?? 0,
    productCount:     productsRes.count ?? 0,
    couponCount:      couponsRes.count ?? 0,
    activeCoupons:    coupons.filter((c) => c.is_active).length,
    orderCount:       orders.length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    lowStockProducts: products.filter((p) => p.stock <= 5).length,
    totalRevenue,
  };

  return { summary, recentOrders: orders.slice(0, 10) };
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("admin_order_details")
    .select("*")
    .order("created_at", { ascending: false });
  dbErr(error, "Failed to load orders.");
  return (data ?? []) as AdminOrder[];
}

export async function getAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });
  dbErr(error, "Failed to load products.");
  return (data as ProductRow[]).map(mapProduct);
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from("coupons").select("*").order("id", { ascending: false });
  dbErr(error, "Failed to load coupons.");
  return (data ?? []).map((c) => ({
    id: c.id, code: c.code, description: c.description,
    discountType: c.discount_type, discountValue: Number(c.discount_value),
    minOrderAmount: Number(c.min_order_amount), isActive: c.is_active,
    expiresAt: c.expires_at, createdAt: c.created_at,
  }));
}

export async function updateOrderStatus(orderId: number, status: string): Promise<AdminOrder> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  dbErr(error, "Failed to update order.");
  return data as AdminOrder;
}

export async function updateProduct(
  productId: number, fields: { price?: number; stock?: number; isFeatured?: boolean }
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({ price: fields.price, stock: fields.stock, is_featured: fields.isFeatured })
    .eq("id", productId)
    .select()
    .single();
  dbErr(error, "Failed to update product.");
  return mapProduct(data as ProductRow);
}

export async function createProduct(fields: {
  name: string; category: string; price: number; stock: number; image: string;
  description: string; material: string; dimensions: string; color: string;
  rating: number; isFeatured: boolean;
}): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: fields.name, category: fields.category, price: fields.price, stock: fields.stock,
      image: fields.image, description: fields.description || null, material: fields.material || null,
      dimensions: fields.dimensions || null, color: fields.color || null,
      rating: fields.rating, is_featured: fields.isFeatured,
    })
    .select()
    .single();
  dbErr(error, "Failed to create product.");
  return mapProduct(data as ProductRow);
}

export async function deleteProduct(productId: number): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  dbErr(error, "Failed to delete product.");
}

export async function createCoupon(fields: {
  code: string; description?: string | null; discountType: "percent" | "fixed";
  discountValue: number; minOrderAmount: number; expiresAt?: string | null;
}): Promise<Coupon> {
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: fields.code, description: fields.description ?? null,
      discount_type: fields.discountType, discount_value: fields.discountValue,
      min_order_amount: fields.minOrderAmount, expires_at: fields.expiresAt ?? null,
    })
    .select()
    .single();
  dbErr(error, "Failed to create coupon.");
  const c = data as { id: number; code: string; description: string | null;
    discount_type: "percent"|"fixed"; discount_value: number; min_order_amount: number;
    is_active: boolean; expires_at: string | null; created_at: string };
  return {
    id: c.id, code: c.code, description: c.description, discountType: c.discount_type,
    discountValue: Number(c.discount_value), minOrderAmount: Number(c.min_order_amount),
    isActive: c.is_active, expiresAt: c.expires_at, createdAt: c.created_at,
  };
}

export async function updateCoupon(couponId: number, fields: { isActive: boolean }): Promise<Coupon> {
  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: fields.isActive })
    .eq("id", couponId)
    .select()
    .single();
  dbErr(error, "Failed to update coupon.");
  const c = data as { id: number; code: string; description: string | null;
    discount_type: "percent"|"fixed"; discount_value: number; min_order_amount: number;
    is_active: boolean; expires_at: string | null; created_at: string };
  return {
    id: c.id, code: c.code, description: c.description, discountType: c.discount_type,
    discountValue: Number(c.discount_value), minOrderAmount: Number(c.min_order_amount),
    isActive: c.is_active, expiresAt: c.expires_at, createdAt: c.created_at,
  };
}

export async function deleteCoupon(couponId: number): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", couponId);
  dbErr(error, "Failed to delete coupon.");
}
