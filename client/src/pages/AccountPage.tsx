import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import type { Order } from "../lib/types";

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ orders: Order[] }>("/orders");
        setOrders(data.orders);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <section className="container section">
      <div className="account-header reveal">
        <div>
          <p className="eyebrow">My Account</p>
          <h1>{user?.name}</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-secondary" onClick={signOut}>
          Logout
        </button>
      </div>

      <div className="orders-block reveal">
        <h2>Order History</h2>

        {loading && <div className="page-state">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="page-state">No orders yet. Start shopping your favorite furniture.</div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div>
                  <p className="order-id">Order #{order.id}</p>
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
      </div>
    </section>
  );
}