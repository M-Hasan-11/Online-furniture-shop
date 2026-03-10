import {
  AlertTriangle,
  BarChart3,
  Clock3,
  DollarSign,
  Download,
  ShoppingCart,
  TicketPercent,
  UsersRound,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import type { AdminOrder, AdminSummary, Coupon, Product } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";
import { cn } from "../lib/cn";

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const EMPTY_SUMMARY: AdminSummary = {
  userCount: 0, productCount: 0, couponCount: 0, activeCoupons: 0,
  orderCount: 0, processingOrders: 0, lowStockProducts: 0, totalRevenue: 0,
};

interface SummaryResponse { summary: AdminSummary; recentOrders: AdminOrder[]; }
interface OrdersResponse { orders: AdminOrder[]; }
interface ProductsResponse { products: Product[]; }
interface CouponsResponse { coupons: Coupon[]; }
interface UpdateOrderResponse { order: AdminOrder; }
interface ProductResponse { product: Product; }
interface CouponResponse { coupon: Coupon; }

interface ProductDraft { price: string; stock: string; isFeatured: "0" | "1"; }

interface CreateProductForm {
  name: string; category: string; price: string; stock: string; image: string;
  description: string; material: string; dimensions: string; color: string;
  rating: string; isFeatured: "0" | "1";
}

interface CreateCouponForm {
  code: string; description: string; discountType: "percent" | "fixed";
  discountValue: string; minOrderAmount: string; expiresAt: string;
}

const DEFAULT_PRODUCT_FORM: CreateProductForm = {
  name: "", category: "Sofas", price: "", stock: "", image: "", description: "",
  material: "", dimensions: "", color: "", rating: "4.5", isFeatured: "0",
};

const DEFAULT_COUPON_FORM: CreateCouponForm = {
  code: "", description: "", discountType: "percent",
  discountValue: "", minOrderAmount: "0", expiresAt: "",
};

function featuredFlag(value: unknown): "0" | "1" {
  return Number(value) > 0 || value === true ? "1" : "0";
}

function buildDrafts(products: Product[]): Record<number, ProductDraft> {
  const drafts: Record<number, ProductDraft> = {};
  for (const p of products) {
    drafts[p.id] = { price: String(p.price), stock: String(p.stock), isFeatured: featuredFlag(p.isFeatured) };
  }
  return drafts;
}

function extractApiMessage(error: unknown, fallback: string): string {
  if (
    error && typeof error === "object" && "response" in error &&
    error.response && typeof error.response === "object" && "data" in error.response &&
    error.response.data && typeof error.response.data === "object" && "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) return error.response.data.message;
  return fallback;
}

function formatCurrency(v: number) { return `$${v.toFixed(2)}`; }
function formatStatus(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function csvEscape(v: unknown) { const t = String(v ?? ""); return `"${t.replace(/"/g, '""')}"`; }

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    processing: "status-processing", shipped: "status-shipped",
    delivered: "status-delivered", cancelled: "status-cancelled",
    active: "status-delivered", inactive: "status-cancelled",
  };
  return (
    <span className={map[status] ?? "bg-stone text-charcoal-muted border border-warm-gray rounded-full px-2.5 py-0.5 text-xs font-medium"}>
      {formatStatus(status)}
    </span>
  );
}

const FIELD = "form-input text-xs py-2";
const LABEL = "form-label text-xs";
const TH = "text-left eyebrow py-3 px-4 border-b border-warm-gray whitespace-nowrap";
const TD = "py-3 px-4 text-sm text-charcoal align-middle border-b border-warm-gray/50";

export function AdminPage() {
  usePageMeta("Admin Dashboard");

  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({});
  const [newProduct, setNewProduct] = useState<CreateProductForm>(DEFAULT_PRODUCT_FORM);
  const [newCoupon, setNewCoupon] = useState<CreateCouponForm>(DEFAULT_COUPON_FORM);

  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [savingCouponId, setSavingCouponId] = useState<number | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<number | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<"all" | "active" | "inactive" | "expiring">("all");

  const loadSummary = async () => {
    const { data } = await api.get<SummaryResponse>("/admin/summary");
    setSummary(data.summary);
    setRecentOrders(data.recentOrders);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [summaryRes, ordersRes, productsRes, couponsRes] = await Promise.all([
          api.get<SummaryResponse>("/admin/summary"),
          api.get<OrdersResponse>("/admin/orders"),
          api.get<ProductsResponse>("/admin/products"),
          api.get<CouponsResponse>("/admin/coupons"),
        ]);
        setSummary(summaryRes.data.summary);
        setRecentOrders(summaryRes.data.recentOrders);
        setOrders(ordersRes.data.orders);
        setProducts(productsRes.data.products);
        setCoupons(couponsRes.data.coupons);
        setProductDrafts(buildDrafts(productsRes.data.products));
      } catch (err) {
        toast.error(extractApiMessage(err, "Failed to load admin dashboard."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.id - a.id), [products]);

  const orderStatusCounts = useMemo<Record<OrderStatus, number>>(() => {
    const c = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) { if (o.status in c) c[o.status as OrderStatus]++; }
    return c;
  }, [orders]);

  const averageOrderValue = useMemo(() =>
    summary.orderCount === 0 ? 0 : summary.totalRevenue / summary.orderCount,
    [summary.orderCount, summary.totalRevenue]
  );

  const couponActivityRate = useMemo(() =>
    summary.couponCount === 0 ? 0 : (summary.activeCoupons / summary.couponCount) * 100,
    [summary.activeCoupons, summary.couponCount]
  );

  const lastUpdated = useMemo(
    () => new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders.length, products.length, coupons.length, summary.totalRevenue]
  );

  const productCategories = useMemo(
    () => ["all", ...Array.from(new Set(sortedProducts.map((p) => p.category))).sort()],
    [sortedProducts]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (!q) return true;
      return String(o.id).includes(q) || o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) || (o.couponCode || "").toLowerCase().includes(q);
    });
  }, [orderSearch, orderStatusFilter, orders]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return sortedProducts.filter((p) => {
      if (productCategoryFilter !== "all" && p.category !== productCategoryFilter) return false;
      if (!q) return true;
      return String(p.id).includes(q) || p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) || (p.material || "").toLowerCase().includes(q) ||
        (p.color || "").toLowerCase().includes(q);
    });
  }, [productCategoryFilter, productSearch, sortedProducts]);

  const filteredCoupons = useMemo(() => {
    const q = couponSearch.trim().toLowerCase();
    const now = Date.now();
    const twoWeeks = now + 14 * 86400000;
    return coupons.filter((c) => {
      const active = Boolean(c.isActive);
      const expiresMs = c.expiresAt ? new Date(c.expiresAt).getTime() : null;
      const expiringSoon = expiresMs !== null && expiresMs >= now && expiresMs <= twoWeeks;
      const matchesFilter = couponFilter === "all" ? true : couponFilter === "active" ? active :
        couponFilter === "inactive" ? !active : expiringSoon;
      if (!matchesFilter) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
    });
  }, [couponFilter, couponSearch, coupons]);

  const exportOrdersCsv = () => {
    const headers = ["Order ID","Customer","Email","Status","Items","Subtotal","Shipping","Discount","Coupon","Total","Created At"];
    const rows = filteredOrders.map((o) => [o.id,o.customerName,o.customerEmail,o.status,o.itemCount,
      o.subtotal.toFixed(2),o.shippingFee.toFixed(2),o.discountAmount.toFixed(2),o.couponCode||"",o.total.toFixed(2),o.createdAt]);
    const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} orders to CSV.`);
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      const { data } = await api.patch<UpdateOrderResponse>(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      setRecentOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o)));
      await loadSummary();
      toast.success(`Order #${orderId} updated to ${status}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not update order status."));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateDraft = (id: number, field: keyof ProductDraft, value: string) => {
    setProductDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveProduct = async (productId: number) => {
    const draft = productDrafts[productId];
    if (!draft) return;
    const price = Number(draft.price), stock = Number(draft.stock);
    if (!Number.isFinite(price) || price <= 0) { toast.error("Price must be > 0."); return; }
    if (!Number.isInteger(stock) || stock < 0) { toast.error("Stock must be >= 0."); return; }
    try {
      setSavingProductId(productId);
      const { data } = await api.patch<ProductResponse>(`/admin/products/${productId}`, {
        price, stock, isFeatured: draft.isFeatured === "1",
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? data.product : p)));
      setProductDrafts((prev) => ({ ...prev, [productId]: {
        price: String(data.product.price), stock: String(data.product.stock),
        isFeatured: featuredFlag(data.product.isFeatured),
      }}));
      await loadSummary();
      toast.success(`Saved ${data.product.name}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not update product."));
    } finally {
      setSavingProductId(null);
    }
  };

  const deleteProduct = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return;
    try {
      setDeletingProductId(productId);
      await api.delete(`/admin/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setProductDrafts((prev) => { const n = { ...prev }; delete n[productId]; return n; });
      await loadSummary();
      toast.success(`Deleted ${target.name}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not delete product."));
    } finally {
      setDeletingProductId(null);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newProduct.price), stock = Number(newProduct.stock), rating = Number(newProduct.rating || 0);
    if (!Number.isFinite(price) || price <= 0) { toast.error("Price must be > 0."); return; }
    if (!Number.isInteger(stock) || stock < 0) { toast.error("Stock must be >= 0."); return; }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) { toast.error("Rating must be 0–5."); return; }
    try {
      setCreatingProduct(true);
      const { data } = await api.post<ProductResponse>("/admin/products", {
        ...newProduct, price, stock, rating, isFeatured: newProduct.isFeatured === "1",
      });
      setProducts((prev) => [data.product, ...prev]);
      setProductDrafts((prev) => ({ ...prev, [data.product.id]: {
        price: String(data.product.price), stock: String(data.product.stock),
        isFeatured: featuredFlag(data.product.isFeatured),
      }}));
      setNewProduct(DEFAULT_PRODUCT_FORM);
      await loadSummary();
      toast.success(`Created ${data.product.name}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not create product."));
    } finally {
      setCreatingProduct(false);
    }
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountValue = Number(newCoupon.discountValue), minOrderAmount = Number(newCoupon.minOrderAmount);
    if (!newCoupon.code.trim()) { toast.error("Coupon code is required."); return; }
    if (!Number.isFinite(discountValue) || discountValue <= 0) { toast.error("Discount must be > 0."); return; }
    if (newCoupon.discountType === "percent" && discountValue > 100) { toast.error("Percent cannot exceed 100."); return; }
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) { toast.error("Min order must be >= 0."); return; }
    try {
      setCreatingCoupon(true);
      const { data } = await api.post<CouponResponse>("/admin/coupons", {
        code: newCoupon.code, description: newCoupon.description || null,
        discountType: newCoupon.discountType, discountValue, minOrderAmount,
        expiresAt: newCoupon.expiresAt || null,
      });
      setCoupons((prev) => [data.coupon, ...prev]);
      setNewCoupon(DEFAULT_COUPON_FORM);
      await loadSummary();
      toast.success(`Created coupon ${data.coupon.code}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not create coupon."));
    } finally {
      setCreatingCoupon(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      setSavingCouponId(coupon.id);
      const { data } = await api.patch<CouponResponse>(`/admin/coupons/${coupon.id}`, {
        isActive: coupon.isActive ? 0 : 1,
      });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data.coupon : c)));
      await loadSummary();
      toast.success(`${data.coupon.code} is now ${data.coupon.isActive ? "active" : "inactive"}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not update coupon."));
    } finally {
      setSavingCouponId(null);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      setDeletingCouponId(coupon.id);
      await api.delete(`/admin/coupons/${coupon.id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      await loadSummary();
      toast.success(`Deleted coupon ${coupon.code}.`);
    } catch (err) {
      toast.error(extractApiMessage(err, "Could not delete coupon."));
    } finally {
      setDeletingCouponId(null);
    }
  };

  /* ── KPI data ── */
  const kpis = [
    { label: "Revenue", value: formatCurrency(summary.totalRevenue), note: `${summary.orderCount} total orders`, accent: false },
    { label: "Avg. Order", value: formatCurrency(averageOrderValue), note: "Average checkout value", accent: true },
    { label: "Customers", value: String(summary.userCount), note: "Registered accounts", accent: false },
    { label: "Catalog", value: String(summary.productCount), note: `${summary.lowStockProducts} low-stock`, accent: false },
    { label: "Coupons", value: `${summary.activeCoupons}/${summary.couponCount}`, note: `${couponActivityRate.toFixed(1)}% active`, accent: true },
    { label: "Fulfillment", value: String(summary.processingOrders), note: "Orders to ship", accent: summary.processingOrders > 0 },
  ];

  return (
    <div className="section">
      {/* Header */}
      <div className="mb-10">
        <p className="eyebrow mb-1">Admin Dashboard</p>
        <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-charcoal tracking-tight mb-2">
          Store Control Center
        </h1>
        <div className="flex flex-wrap gap-3 text-xs text-charcoal-muted">
          <span className="flex items-center gap-1.5"><Clock3 size={12} />Updated {lastUpdated}</span>
          <span className="flex items-center gap-1.5"><BarChart3 size={12} />{summary.processingOrders} orders in pipeline</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {kpis.map((k) => (
          <div key={k.label} className={cn("card p-4 flex flex-col gap-1", k.accent && "border-gold/30 bg-gold/5")}>
            <p className="eyebrow">{k.label}</p>
            <p className="font-serif text-2xl text-charcoal">{k.value}</p>
            <p className="text-xs text-charcoal-muted">{k.note}</p>
          </div>
        ))}
      </div>

      {/* Pipeline + glance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card p-5">
          <h2 className="font-serif text-lg text-charcoal mb-4">Order Pipeline</h2>
          <div className="grid grid-cols-2 gap-3">
            {(["processing","shipped","delivered","cancelled"] as OrderStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between bg-stone rounded-xl px-3 py-2.5">
                <StatusPill status={s} />
                <span className="font-serif text-lg text-charcoal">{orderStatusCounts[s]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg text-charcoal mb-4">At a Glance</h2>
          <ul className="flex flex-col gap-2.5 text-sm text-charcoal-muted">
            {[
              { icon: <DollarSign size={13} />, text: `${formatCurrency(summary.totalRevenue)} lifetime revenue` },
              { icon: <ShoppingCart size={13} />, text: `${summary.orderCount} total orders processed` },
              { icon: <UsersRound size={13} />, text: `${summary.userCount} registered customers` },
              { icon: <TicketPercent size={13} />, text: `${summary.activeCoupons} active promotions` },
              { icon: <AlertTriangle size={13} />, text: `${summary.lowStockProducts} products at low stock` },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="text-gold shrink-0">{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent + Manage orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Recent orders */}
        <div className="card p-5">
          <h2 className="font-serif text-lg text-charcoal mb-4">Recent Orders</h2>
          {loading && <p className="text-sm text-charcoal-muted">Loading…</p>}
          {!loading && recentOrders.length === 0 && <p className="text-sm text-charcoal-muted">No orders yet.</p>}
          {!loading && recentOrders.length > 0 && (
            <div className="flex flex-col divide-y divide-warm-gray">
              {recentOrders.map((o) => (
                <div key={`rec-${o.id}`} className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">#{o.id} — {o.customerName}</p>
                    <p className="text-xs text-charcoal-muted">{new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} items</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={o.status} />
                    <span className="text-sm font-medium text-charcoal">{formatCurrency(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-charcoal">Manage Orders</h2>
            <button onClick={exportOrdersCsv} className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5">
              <Download size={12} />CSV
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
              <input className={cn(FIELD, "pl-8")} placeholder="Search orders…" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
            </div>
            <select className={cn(FIELD, "w-36")} value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as "all" | OrderStatus)}>
              <option value="all">All</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
          </div>
          {filteredOrders.length === 0 && <p className="text-sm text-charcoal-muted">No orders match filters.</p>}
          {filteredOrders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className={TH}>Order</th><th className={TH}>Customer</th><th className={TH}>Total</th><th className={TH}>Update</th></tr></thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone/50">
                      <td className={TD}>
                        <span className="font-medium">#{o.id}</span>
                        <br /><span className="text-xs text-charcoal-muted">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className={TD}>
                        {o.customerName}
                        <br /><span className="text-xs text-charcoal-muted">{o.customerEmail}</span>
                      </td>
                      <td className={TD}>
                        {formatCurrency(o.total)}
                        {o.couponCode && <span className="text-xs text-charcoal-muted ml-1">({o.couponCode})</span>}
                      </td>
                      <td className={TD}>
                        <select
                          className={cn(FIELD, "w-32")}
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                          disabled={updatingOrderId === o.id}
                        >
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Catalog management */}
      <div className="card p-6 mb-8">
        <h2 className="font-serif text-xl text-charcoal mb-6">Catalog Management</h2>

        <form onSubmit={createProduct} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Name", field: "name", type: "text", required: true },
            { label: "Category", field: "category", type: "text", required: true },
            { label: "Price", field: "price", type: "number", step: "0.01", min: "0.01", required: true },
            { label: "Stock", field: "stock", type: "number", step: "1", min: "0", required: true },
            { label: "Image URL", field: "image", type: "text", required: true },
            { label: "Rating", field: "rating", type: "number", step: "0.1", min: "0", max: "5" },
            { label: "Material", field: "material", type: "text" },
            { label: "Dimensions", field: "dimensions", type: "text" },
            { label: "Color", field: "color", type: "text" },
          ].map(({ label, field, ...rest }) => (
            <div key={field}>
              <label className={LABEL}>{label}</label>
              <input
                className={FIELD}
                value={newProduct[field as keyof CreateProductForm] as string}
                onChange={(e) => setNewProduct((p) => ({ ...p, [field]: e.target.value }))}
                {...rest}
              />
            </div>
          ))}
          <div>
            <label className={LABEL}>Featured</label>
            <select className={FIELD} value={newProduct.isFeatured} onChange={(e) => setNewProduct((p) => ({ ...p, isFeatured: e.target.value as "0"|"1" }))}>
              <option value="0">No</option><option value="1">Yes</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-3 lg:col-span-5">
            <label className={LABEL}>Description</label>
            <textarea className={cn(FIELD, "resize-none")} rows={2} value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} required />
          </div>
          <div className="col-span-2 sm:col-span-3 lg:col-span-5">
            <button type="submit" disabled={creatingProduct} className="btn-primary text-xs px-5 py-2.5">
              {creatingProduct ? "Creating…" : "Add Product"}
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
            <input className={cn(FIELD, "pl-8")} placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          </div>
          <select className={cn(FIELD, "w-40")} value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}>
            {productCategories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
        </div>

        {filteredProducts.length === 0 && <p className="text-sm text-charcoal-muted">No products match filters.</p>}
        {filteredProducts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Product</th><th className={TH}>Category</th><th className={TH}>Price</th><th className={TH}>Stock</th><th className={TH}>Featured</th><th className={TH}>Actions</th></tr></thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const d = productDrafts[p.id] || { price: String(p.price), stock: String(p.stock), isFeatured: featuredFlag(p.isFeatured) };
                  return (
                    <tr key={p.id} className="hover:bg-stone/50">
                      <td className={TD}><span className="font-medium">{p.name}</span><br /><span className="text-xs text-charcoal-muted">#{p.id}</span></td>
                      <td className={TD}>{p.category}</td>
                      <td className={TD}><input className={cn(FIELD, "w-24")} type="number" step="0.01" min="0.01" value={d.price} onChange={(e) => updateDraft(p.id, "price", e.target.value)} /></td>
                      <td className={TD}><input className={cn(FIELD, "w-20")} type="number" step="1" min="0" value={d.stock} onChange={(e) => updateDraft(p.id, "stock", e.target.value)} /></td>
                      <td className={TD}>
                        <select className={cn(FIELD, "w-16")} value={d.isFeatured} onChange={(e) => updateDraft(p.id, "isFeatured", e.target.value as "0"|"1")}>
                          <option value="0">No</option><option value="1">Yes</option>
                        </select>
                      </td>
                      <td className={TD}>
                        <div className="flex gap-1.5">
                          <button onClick={() => saveProduct(p.id)} disabled={savingProductId === p.id} className="btn-primary px-3 py-1.5 text-xs">{savingProductId === p.id ? "…" : "Save"}</button>
                          <button onClick={() => deleteProduct(p.id)} disabled={deletingProductId === p.id} className="btn-outline px-3 py-1.5 text-xs text-error border-error/30 hover:border-error">{deletingProductId === p.id ? "…" : "Delete"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coupon management */}
      <div className="card p-6">
        <h2 className="font-serif text-xl text-charcoal mb-6">Coupon Management</h2>

        <form onSubmit={createCoupon} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Code", field: "code", type: "text", required: true },
            { label: "Discount Value", field: "discountValue", type: "number", step: "0.01", min: "0.01", required: true },
            { label: "Min Order", field: "minOrderAmount", type: "number", step: "0.01", min: "0" },
            { label: "Expires At", field: "expiresAt", type: "date" },
          ].map(({ label, field, ...rest }) => (
            <div key={field}>
              <label className={LABEL}>{label}</label>
              <input
                className={FIELD}
                value={newCoupon[field as keyof CreateCouponForm] as string}
                onChange={(e) => setNewCoupon((c) => ({ ...c, [field]: field === "code" ? e.target.value.toUpperCase() : e.target.value }))}
                {...rest}
              />
            </div>
          ))}
          <div>
            <label className={LABEL}>Type</label>
            <select className={FIELD} value={newCoupon.discountType} onChange={(e) => setNewCoupon((c) => ({ ...c, discountType: e.target.value as "percent"|"fixed" }))}>
              <option value="percent">Percent %</option><option value="fixed">Fixed $</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <label className={LABEL}>Description</label>
            <input className={FIELD} value={newCoupon.description} onChange={(e) => setNewCoupon((c) => ({ ...c, description: e.target.value }))} />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <button type="submit" disabled={creatingCoupon} className="btn-primary text-xs px-5 py-2.5">
              {creatingCoupon ? "Creating…" : "Add Coupon"}
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
            <input className={cn(FIELD, "pl-8")} placeholder="Search coupons…" value={couponSearch} onChange={(e) => setCouponSearch(e.target.value)} />
          </div>
          <select className={cn(FIELD, "w-44")} value={couponFilter} onChange={(e) => setCouponFilter(e.target.value as "all"|"active"|"inactive"|"expiring")}>
            <option value="all">All</option><option value="active">Active</option>
            <option value="inactive">Inactive</option><option value="expiring">Expiring soon</option>
          </select>
        </div>

        {filteredCoupons.length === 0 && <p className="text-sm text-charcoal-muted">No coupons match filters.</p>}
        {filteredCoupons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Code</th><th className={TH}>Discount</th><th className={TH}>Min Order</th><th className={TH}>Expires</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr></thead>
              <tbody>
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-stone/50">
                    <td className={TD}><code className="font-mono text-xs bg-stone px-1.5 py-0.5 rounded">{c.code}</code>{c.description && <span className="text-xs text-charcoal-muted ml-1">— {c.description}</span>}</td>
                    <td className={TD}>{c.discountType === "percent" ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</td>
                    <td className={TD}>{formatCurrency(c.minOrderAmount)}</td>
                    <td className={TD}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                    <td className={TD}><StatusPill status={c.isActive ? "active" : "inactive"} /></td>
                    <td className={TD}>
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleCouponStatus(c)} disabled={savingCouponId === c.id} className="btn-primary px-3 py-1.5 text-xs">{savingCouponId === c.id ? "…" : c.isActive ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => deleteCoupon(c)} disabled={deletingCouponId === c.id} className="btn-outline px-3 py-1.5 text-xs text-error border-error/30 hover:border-error">{deletingCouponId === c.id ? "…" : "Delete"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
