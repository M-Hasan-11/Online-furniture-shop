import {
  AlertTriangle,
  BarChart3,
  Clock3,
  DollarSign,
  Download,
  ShoppingCart,
  TicketPercent,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import type { AdminOrder, AdminSummary, Coupon, Product } from "../lib/types";

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const EMPTY_SUMMARY: AdminSummary = {
  userCount: 0,
  productCount: 0,
  couponCount: 0,
  activeCoupons: 0,
  orderCount: 0,
  processingOrders: 0,
  lowStockProducts: 0,
  totalRevenue: 0,
};

interface SummaryResponse {
  summary: AdminSummary;
  recentOrders: AdminOrder[];
}

interface OrdersResponse {
  orders: AdminOrder[];
}

interface ProductsResponse {
  products: Product[];
}

interface CouponsResponse {
  coupons: Coupon[];
}

interface UpdateOrderResponse {
  order: AdminOrder;
}

interface ProductResponse {
  product: Product;
}

interface CouponResponse {
  coupon: Coupon;
}

interface ProductDraft {
  price: string;
  stock: string;
  isFeatured: "0" | "1";
}

interface CreateProductForm {
  name: string;
  category: string;
  price: string;
  stock: string;
  image: string;
  description: string;
  material: string;
  dimensions: string;
  color: string;
  rating: string;
  isFeatured: "0" | "1";
}

interface CreateCouponForm {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrderAmount: string;
  expiresAt: string;
}

interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: "brand" | "accent" | "neutral" | "warning";
}

const DEFAULT_PRODUCT_FORM: CreateProductForm = {
  name: "",
  category: "Sofas",
  price: "",
  stock: "",
  image: "",
  description: "",
  material: "",
  dimensions: "",
  color: "",
  rating: "4.5",
  isFeatured: "0",
};

const DEFAULT_COUPON_FORM: CreateCouponForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "0",
  expiresAt: "",
};

function featuredFlag(value: unknown): "0" | "1" {
  return Number(value) > 0 || value === true ? "1" : "0";
}

function buildDrafts(products: Product[]): Record<number, ProductDraft> {
  const drafts: Record<number, ProductDraft> = {};

  for (const product of products) {
    drafts[product.id] = {
      price: String(product.price),
      stock: String(product.stock),
      isFeatured: featuredFlag(product.isFeatured),
    };
  }

  return drafts;
}

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

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({});
  const [newProduct, setNewProduct] = useState<CreateProductForm>(DEFAULT_PRODUCT_FORM);
  const [newCoupon, setNewCoupon] = useState<CreateCouponForm>(DEFAULT_COUPON_FORM);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    const loadAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotice(null);

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
        setError(extractApiMessage(err, "Failed to load admin dashboard. Please login as admin."));
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.id - a.id), [products]);

  const orderStatusCounts = useMemo<Record<OrderStatus, number>>(() => {
    const counts: Record<OrderStatus, number> = {
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      if (order.status in counts) {
        counts[order.status as OrderStatus] += 1;
      }
    }

    return counts;
  }, [orders]);

  const averageOrderValue = useMemo(() => {
    if (summary.orderCount === 0) {
      return 0;
    }

    return summary.totalRevenue / summary.orderCount;
  }, [summary.orderCount, summary.totalRevenue]);

  const couponActivityRate = useMemo(() => {
    if (summary.couponCount === 0) {
      return 0;
    }

    return (summary.activeCoupons / summary.couponCount) * 100;
  }, [summary.activeCoupons, summary.couponCount]);

  const dashboardMetrics = useMemo<DashboardMetric[]>(
    () => [
      {
        key: "revenue",
        label: "Revenue",
        value: formatCurrency(summary.totalRevenue),
        note: `${summary.orderCount} total orders`,
        tone: "brand",
      },
      {
        key: "avg-order",
        label: "Avg. Order",
        value: formatCurrency(averageOrderValue),
        note: "Average checkout value",
        tone: "accent",
      },
      {
        key: "customers",
        label: "Customers",
        value: String(summary.userCount),
        note: `${summary.userCount === 0 ? "No signups yet" : "Registered accounts"}`,
        tone: "neutral",
      },
      {
        key: "catalog",
        label: "Catalog",
        value: String(summary.productCount),
        note: `${summary.lowStockProducts} low-stock products`,
        tone: "neutral",
      },
      {
        key: "coupons",
        label: "Coupons",
        value: `${summary.activeCoupons}/${summary.couponCount}`,
        note: `${couponActivityRate.toFixed(1)}% currently active`,
        tone: "accent",
      },
      {
        key: "queue",
        label: "Fulfillment",
        value: String(summary.processingOrders),
        note: "Orders waiting to ship",
        tone: "warning",
      },
    ],
    [
      averageOrderValue,
      couponActivityRate,
      summary.activeCoupons,
      summary.couponCount,
      summary.lowStockProducts,
      summary.orderCount,
      summary.processingOrders,
      summary.productCount,
      summary.totalRevenue,
      summary.userCount,
    ]
  );

  const lastUpdated = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [orders.length, products.length, coupons.length, summary.totalRevenue]
  );

  const productCategories = useMemo(
    () => ["all", ...Array.from(new Set(sortedProducts.map((product) => product.category))).sort()],
    [sortedProducts]
  );

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === "all" ? true : order.status === orderStatusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        String(order.id).includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        (order.couponCode || "").toLowerCase().includes(query)
      );
    });
  }, [orderSearch, orderStatusFilter, orders]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const matchesCategory =
        productCategoryFilter === "all" ? true : product.category === productCategoryFilter;
      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        String(product.id).includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.material || "").toLowerCase().includes(query) ||
        (product.color || "").toLowerCase().includes(query)
      );
    });
  }, [productCategoryFilter, productSearch, sortedProducts]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch.trim().toLowerCase();
    const now = Date.now();
    const nextTwoWeeks = now + 14 * 24 * 60 * 60 * 1000;

    return coupons.filter((coupon) => {
      const isActive = Boolean(coupon.isActive);
      const expiresMs = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;
      const isExpiringSoon = expiresMs !== null && expiresMs >= now && expiresMs <= nextTwoWeeks;

      const matchesFilter =
        couponFilter === "all"
          ? true
          : couponFilter === "active"
            ? isActive
            : couponFilter === "inactive"
              ? !isActive
              : isExpiringSoon;
      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        coupon.code.toLowerCase().includes(query) ||
        (coupon.description || "").toLowerCase().includes(query)
      );
    });
  }, [couponFilter, couponSearch, coupons]);

  const exportOrdersCsv = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Status",
      "Items",
      "Subtotal",
      "Shipping",
      "Discount",
      "Coupon",
      "Total",
      "Created At",
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customerName,
      order.customerEmail,
      order.status,
      order.itemCount,
      order.subtotal.toFixed(2),
      order.shippingFee.toFixed(2),
      order.discountAmount.toFixed(2),
      order.couponCode || "",
      order.total.toFixed(2),
      order.createdAt,
    ]);

    const csv = [
      headers.map((header) => csvEscape(header)).join(","),
      ...rows.map((row) => row.map((value) => csvEscape(value)).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `orders-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filteredOrders.length} orders to CSV.`);
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      setNotice(null);

      const { data } = await api.patch<UpdateOrderResponse>(`/admin/orders/${orderId}/status`, {
        status,
      });

      setOrders((prev) => prev.map((order) => (order.id === orderId ? data.order : order)));
      setRecentOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: data.order.status } : order))
      );

      await loadSummary();
      setNotice(`Order #${orderId} updated to ${status}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not update order status."));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateDraft = (productId: number, field: keyof ProductDraft, value: string) => {
    setProductDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const saveProduct = async (productId: number) => {
    const draft = productDrafts[productId];
    if (!draft) {
      return;
    }

    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a whole number >= 0.");
      return;
    }

    try {
      setSavingProductId(productId);
      setError(null);
      setNotice(null);

      const { data } = await api.patch<ProductResponse>(`/admin/products/${productId}`, {
        price,
        stock,
        isFeatured: draft.isFeatured === "1",
      });

      setProducts((prev) => prev.map((item) => (item.id === productId ? data.product : item)));
      setProductDrafts((prev) => ({
        ...prev,
        [productId]: {
          price: String(data.product.price),
          stock: String(data.product.stock),
          isFeatured: featuredFlag(data.product.isFeatured),
        },
      }));

      await loadSummary();
      setNotice(`Saved updates for ${data.product.name}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not update product."));
    } finally {
      setSavingProductId(null);
    }
  };

  const deleteProduct = async (productId: number) => {
    const target = products.find((item) => item.id === productId);
    if (!target) {
      return;
    }

    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingProductId(productId);
      setError(null);
      setNotice(null);

      await api.delete(`/admin/products/${productId}`);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      setProductDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      await loadSummary();
      setNotice(`Deleted ${target.name}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not delete product."));
    } finally {
      setDeletingProductId(null);
    }
  };

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault();

    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);
    const rating = Number(newProduct.rating || 0);

    if (!Number.isFinite(price) || price <= 0) {
      setError("New product price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("New product stock must be a whole number >= 0.");
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    try {
      setCreatingProduct(true);
      setError(null);
      setNotice(null);

      const { data } = await api.post<ProductResponse>("/admin/products", {
        ...newProduct,
        price,
        stock,
        rating,
        isFeatured: newProduct.isFeatured === "1",
      });

      setProducts((prev) => [data.product, ...prev]);
      setProductDrafts((prev) => ({
        ...prev,
        [data.product.id]: {
          price: String(data.product.price),
          stock: String(data.product.stock),
          isFeatured: featuredFlag(data.product.isFeatured),
        },
      }));
      setNewProduct(DEFAULT_PRODUCT_FORM);

      await loadSummary();
      setNotice(`Created ${data.product.name}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not create product."));
    } finally {
      setCreatingProduct(false);
    }
  };

  const createCoupon = async (event: React.FormEvent) => {
    event.preventDefault();

    const discountValue = Number(newCoupon.discountValue);
    const minOrderAmount = Number(newCoupon.minOrderAmount);

    if (!newCoupon.code.trim()) {
      setError("Coupon code is required.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError("Discount value must be greater than 0.");
      return;
    }

    if (newCoupon.discountType === "percent" && discountValue > 100) {
      setError("Percent discount cannot exceed 100.");
      return;
    }

    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      setError("Minimum order must be >= 0.");
      return;
    }

    try {
      setCreatingCoupon(true);
      setError(null);
      setNotice(null);

      const { data } = await api.post<CouponResponse>("/admin/coupons", {
        code: newCoupon.code,
        description: newCoupon.description || null,
        discountType: newCoupon.discountType,
        discountValue,
        minOrderAmount,
        expiresAt: newCoupon.expiresAt || null,
      });

      setCoupons((prev) => [data.coupon, ...prev]);
      setNewCoupon(DEFAULT_COUPON_FORM);
      await loadSummary();
      setNotice(`Created coupon ${data.coupon.code}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not create coupon."));
    } finally {
      setCreatingCoupon(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      setSavingCouponId(coupon.id);
      setError(null);
      setNotice(null);

      const { data } = await api.patch<CouponResponse>(`/admin/coupons/${coupon.id}`, {
        isActive: coupon.isActive ? 0 : 1,
      });

      setCoupons((prev) => prev.map((item) => (item.id === coupon.id ? data.coupon : item)));
      await loadSummary();
      setNotice(`${data.coupon.code} is now ${data.coupon.isActive ? "active" : "inactive"}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not update coupon."));
    } finally {
      setSavingCouponId(null);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) {
      return;
    }

    try {
      setDeletingCouponId(coupon.id);
      setError(null);
      setNotice(null);

      await api.delete(`/admin/coupons/${coupon.id}`);
      setCoupons((prev) => prev.filter((item) => item.id !== coupon.id));
      await loadSummary();
      setNotice(`Deleted coupon ${coupon.code}.`);
    } catch (err) {
      setError(extractApiMessage(err, "Could not delete coupon."));
    } finally {
      setDeletingCouponId(null);
    }
  };

  return (
    <section className="container section">
      <div className="admin-dashboard-hero reveal">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Modern Store Control Center</h1>
          <p className="admin-hero-copy">
            Monitor sales health, fulfillment progress, inventory, and promotions in real time.
          </p>
        </div>
        <div className="admin-hero-meta">
          <div className="admin-meta-chip">
            <Clock3 size={15} />
            Updated {lastUpdated}
          </div>
          <div className="admin-meta-chip">
            <BarChart3 size={15} />
            {summary.processingOrders} orders in active pipeline
          </div>
        </div>
      </div>

      {error && <div className="page-state error admin-alert">{error}</div>}
      {notice && <div className="page-state admin-alert">{notice}</div>}

      <div className="admin-kpi-grid reveal">
        {dashboardMetrics.map((metric) => (
          <article className={`admin-kpi-card tone-${metric.tone}`} key={metric.key}>
            <span className="admin-kpi-label">{metric.label}</span>
            <strong className="admin-kpi-value">{metric.value}</strong>
            <p className="admin-kpi-note">{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="admin-insight-grid reveal">
        <article className="admin-panel admin-insight-panel">
          <div className="admin-panel-heading">
            <h2>Pipeline</h2>
            <p className="admin-panel-subtitle">Order status distribution</p>
          </div>

          <div className="admin-status-overview">
            <div className="admin-status-item">
              <span className="admin-status-pill status-processing">Processing</span>
              <strong>{orderStatusCounts.processing}</strong>
            </div>
            <div className="admin-status-item">
              <span className="admin-status-pill status-shipped">Shipped</span>
              <strong>{orderStatusCounts.shipped}</strong>
            </div>
            <div className="admin-status-item">
              <span className="admin-status-pill status-delivered">Delivered</span>
              <strong>{orderStatusCounts.delivered}</strong>
            </div>
            <div className="admin-status-item">
              <span className="admin-status-pill status-cancelled">Cancelled</span>
              <strong>{orderStatusCounts.cancelled}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel admin-insight-panel">
          <div className="admin-panel-heading">
            <h2>At a Glance</h2>
            <p className="admin-panel-subtitle">Critical operating signals</p>
          </div>

          <div className="admin-glance-list">
            <div className="admin-glance-item">
              <DollarSign size={15} />
              <span>{formatCurrency(summary.totalRevenue)} lifetime revenue</span>
            </div>
            <div className="admin-glance-item">
              <ShoppingCart size={15} />
              <span>{summary.orderCount} total orders processed</span>
            </div>
            <div className="admin-glance-item">
              <UsersRound size={15} />
              <span>{summary.userCount} registered customers</span>
            </div>
            <div className="admin-glance-item">
              <TicketPercent size={15} />
              <span>{summary.activeCoupons} active promotions</span>
            </div>
            <div className="admin-glance-item">
              <AlertTriangle size={15} />
              <span>{summary.lowStockProducts} products at or below 5 units</span>
            </div>
          </div>
        </article>
      </div>

      <div className="admin-grid">
        <article className="admin-panel reveal">
          <div className="admin-panel-heading">
            <h2>Recent Orders</h2>
            <p className="admin-panel-subtitle">Latest checkout activity</p>
          </div>
          {loading && <div className="page-state">Loading orders...</div>}

          {!loading && recentOrders.length === 0 && <div className="page-state">No orders yet.</div>}

          {!loading && recentOrders.length > 0 && (
            <div className="orders-list">
              {recentOrders.map((order) => (
                <article className="order-card" key={`recent-${order.id}`}>
                  <div>
                    <p className="order-id">
                      #{order.id} - {order.customerName}
                    </p>
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                    <p>{order.itemCount} items</p>
                  </div>
                  <div className="order-totals">
                    <p className={`admin-status-pill status-${order.status}`}>{formatStatus(order.status)}</p>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel reveal">
          <div className="admin-panel-heading">
            <h2>Manage Orders</h2>
            <p className="admin-panel-subtitle">Update delivery workflow</p>
          </div>

          <div className="admin-toolbar">
            <input
              className="search-input"
              placeholder="Search order, customer, email, coupon"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
            />
            <select
              className="select"
              value={orderStatusFilter}
              onChange={(event) => setOrderStatusFilter(event.target.value as "all" | OrderStatus)}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary btn-small" type="button" onClick={exportOrdersCsv}>
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {filteredOrders.length === 0 && <div className="page-state">No orders match your filters.</div>}

          {filteredOrders.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Current</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        #{order.id}
                        <br />
                        <small>{new Date(order.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        {order.customerName}
                        <br />
                        <small>{order.customerEmail}</small>
                      </td>
                      <td>
                        {formatCurrency(order.total)}
                        {order.couponCode ? <small> ({order.couponCode})</small> : null}
                      </td>
                      <td>
                        <span className={`admin-status-pill status-${order.status}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="select admin-status-select"
                          value={order.status}
                          onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                          disabled={updatingOrderId === order.id}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <article className="admin-panel admin-panel-full reveal">
        <div className="admin-panel-heading">
          <h2>Catalog Management</h2>
          <p className="admin-panel-subtitle">Create, update, and curate products for storefront discovery</p>
        </div>

        <form className="admin-form-grid" onSubmit={createProduct}>
          <label>
            Product Name
            <input
              value={newProduct.name}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>

          <label>
            Category
            <input
              value={newProduct.category}
              onChange={(event) =>
                setNewProduct((prev) => ({ ...prev, category: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Price
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newProduct.price}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </label>

          <label>
            Stock
            <input
              type="number"
              step="1"
              min="0"
              value={newProduct.stock}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, stock: event.target.value }))}
              required
            />
          </label>

          <label>
            Image URL
            <input
              value={newProduct.image}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, image: event.target.value }))}
              required
            />
          </label>

          <label>
            Rating
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={newProduct.rating}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, rating: event.target.value }))}
            />
          </label>

          <label>
            Material
            <input
              value={newProduct.material}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, material: event.target.value }))}
            />
          </label>

          <label>
            Dimensions
            <input
              value={newProduct.dimensions}
              onChange={(event) =>
                setNewProduct((prev) => ({ ...prev, dimensions: event.target.value }))
              }
            />
          </label>

          <label>
            Color
            <input
              value={newProduct.color}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, color: event.target.value }))}
            />
          </label>

          <label>
            Featured
            <select
              className="select"
              value={newProduct.isFeatured}
              onChange={(event) =>
                setNewProduct((prev) => ({
                  ...prev,
                  isFeatured: event.target.value as "0" | "1",
                }))
              }
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </label>

          <label className="admin-full-span">
            Description
            <textarea
              rows={3}
              value={newProduct.description}
              onChange={(event) =>
                setNewProduct((prev) => ({ ...prev, description: event.target.value }))
              }
              required
            />
          </label>

          <div className="admin-form-actions admin-full-span">
            <button className="btn" type="submit" disabled={creatingProduct}>
              {creatingProduct ? "Creating product..." : "Add Product"}
            </button>
          </div>
        </form>

        <div className="admin-toolbar">
          <input
            className="search-input"
            placeholder="Search product by name, id, category, material, color"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
          <select
            className="select"
            value={productCategoryFilter}
            onChange={(event) => setProductCategoryFilter(event.target.value)}
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All categories" : category}
              </option>
            ))}
          </select>
        </div>

        {filteredProducts.length === 0 && <div className="page-state">No products match your filters.</div>}

        {filteredProducts.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const draft = productDrafts[product.id] || {
                    price: String(product.price),
                    stock: String(product.stock),
                    isFeatured: featuredFlag(product.isFeatured),
                  };

                  return (
                    <tr key={product.id}>
                      <td>
                        {product.name}
                        <br />
                        <small>#{product.id}</small>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <input
                          className="admin-inline-input"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={draft.price}
                          onChange={(event) => updateDraft(product.id, "price", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-inline-input"
                          type="number"
                          step="1"
                          min="0"
                          value={draft.stock}
                          onChange={(event) => updateDraft(product.id, "stock", event.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={draft.isFeatured}
                          onChange={(event) =>
                            updateDraft(product.id, "isFeatured", event.target.value as "0" | "1")
                          }
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-small"
                            type="button"
                            onClick={() => saveProduct(product.id)}
                            disabled={savingProductId === product.id}
                          >
                            {savingProductId === product.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            disabled={deletingProductId === product.id}
                          >
                            {deletingProductId === product.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="admin-panel admin-panel-full reveal">
        <div className="admin-panel-heading">
          <h2>Coupon Management</h2>
          <p className="admin-panel-subtitle">Launch, pause, and retire discount campaigns</p>
        </div>

        <form className="admin-form-grid" onSubmit={createCoupon}>
          <label>
            Code
            <input
              value={newCoupon.code}
              onChange={(event) =>
                setNewCoupon((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
              }
              required
            />
          </label>

          <label>
            Discount Type
            <select
              className="select"
              value={newCoupon.discountType}
              onChange={(event) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  discountType: event.target.value as "percent" | "fixed",
                }))
              }
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </label>

          <label>
            Discount Value
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newCoupon.discountValue}
              onChange={(event) =>
                setNewCoupon((prev) => ({ ...prev, discountValue: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Min Order Amount
            <input
              type="number"
              step="0.01"
              min="0"
              value={newCoupon.minOrderAmount}
              onChange={(event) =>
                setNewCoupon((prev) => ({ ...prev, minOrderAmount: event.target.value }))
              }
            />
          </label>

          <label>
            Expires At (Optional)
            <input
              type="date"
              value={newCoupon.expiresAt}
              onChange={(event) =>
                setNewCoupon((prev) => ({ ...prev, expiresAt: event.target.value }))
              }
            />
          </label>

          <label className="admin-full-span">
            Description
            <input
              value={newCoupon.description}
              onChange={(event) =>
                setNewCoupon((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>

          <div className="admin-form-actions admin-full-span">
            <button className="btn" type="submit" disabled={creatingCoupon}>
              {creatingCoupon ? "Creating coupon..." : "Add Coupon"}
            </button>
          </div>
        </form>

        <div className="admin-toolbar">
          <input
            className="search-input"
            placeholder="Search coupon code or description"
            value={couponSearch}
            onChange={(event) => setCouponSearch(event.target.value)}
          />
          <select
            className="select"
            value={couponFilter}
            onChange={(event) =>
              setCouponFilter(event.target.value as "all" | "active" | "inactive" | "expiring")
            }
          >
            <option value="all">All coupons</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expiring">Expiring in 14 days</option>
          </select>
        </div>

        {filteredCoupons.length === 0 && <div className="page-state">No coupons match your filters.</div>}

        {filteredCoupons.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <code className="admin-code">{coupon.code}</code>
                      {coupon.description ? <small> - {coupon.description}</small> : null}
                    </td>
                    <td>
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}%`
                        : formatCurrency(coupon.discountValue)}
                    </td>
                    <td>{formatCurrency(coupon.minOrderAmount)}</td>
                    <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}</td>
                    <td>
                      <span className={coupon.isActive ? "admin-status-pill status-active" : "admin-status-pill status-inactive"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="btn btn-small"
                          type="button"
                          onClick={() => toggleCouponStatus(coupon)}
                          disabled={savingCouponId === coupon.id}
                        >
                          {savingCouponId === coupon.id
                            ? "Updating..."
                            : coupon.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => deleteCoupon(coupon)}
                          disabled={deletingCouponId === coupon.id}
                        >
                          {deletingCouponId === coupon.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
