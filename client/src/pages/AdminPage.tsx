import { useEffect, useState } from "react";
import api from "../lib/api";
import type { AdminOrder, AdminSummary } from "../lib/types";

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

const EMPTY_SUMMARY: AdminSummary = {
  userCount: 0,
  productCount: 0,
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

interface UpdateOrderResponse {
  order: AdminOrder;
}

export function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, ordersRes] = await Promise.all([
          api.get<SummaryResponse>("/admin/summary"),
          api.get<OrdersResponse>("/admin/orders"),
        ]);

        setSummary(summaryRes.data.summary);
        setRecentOrders(summaryRes.data.recentOrders);
        setOrders(ordersRes.data.orders);
      } catch {
        setError("Failed to load admin dashboard. Please login as admin.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);

      const { data } = await api.patch<UpdateOrderResponse>(`/admin/orders/${orderId}/status`, {
        status,
      });

      setOrders((prev) => prev.map((order) => (order.id === orderId ? data.order : order)));
      setRecentOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: data.order.status } : order))
      );
    } catch {
      setError("Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Store Control Panel</h1>
        </div>
      </div>

      {error && <div className="page-state error">{error}</div>}

      <div className="admin-stats-grid reveal">
        <article className="admin-stat-card">
          <span>Total Revenue</span>
          <strong>${summary.totalRevenue.toFixed(2)}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Orders</span>
          <strong>{summary.orderCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Users</span>
          <strong>{summary.userCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Products</span>
          <strong>{summary.productCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Processing</span>
          <strong>{summary.processingOrders}</strong>
        </article>
        <article className="admin-stat-card">
          <span>{"Low Stock (<=5)"}</span>
          <strong>{summary.lowStockProducts}</strong>
        </article>
      </div>

      <div className="admin-grid">
        <article className="admin-panel reveal">
          <h2>Recent Orders</h2>
          {loading && <div className="page-state">Loading orders...</div>}

          {!loading && recentOrders.length === 0 && (
            <div className="page-state">No orders yet.</div>
          )}

          {!loading && recentOrders.length > 0 && (
            <div className="orders-list">
              {recentOrders.map((order) => (
                <article className="order-card" key={`recent-${order.id}`}>
                  <div>
                    <p className="order-id">#{order.id} - {order.customerName}</p>
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                    <p>{order.itemCount} items</p>
                  </div>
                  <div>
                    <p className="order-status">{order.status}</p>
                    <strong>${order.total.toFixed(2)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel reveal">
          <h2>Manage Orders</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <select
                        className="select"
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                        disabled={updatingOrderId === order.id}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
