import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getOrders } from "../lib/db";
import type { Order } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    processing: "status-processing",
    shipped: "status-shipped",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
    pending_payment: "status-pending_payment",
    payment_failed: "status-payment_failed",
  };
  return (
    <span className={map[status] ?? "bg-stone text-charcoal-muted border border-warm-gray rounded-full px-2.5 py-0.5 text-xs font-medium"}>
      {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
    </span>
  );
}

export function AccountPage() {
  usePageMeta("My Account");

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getOrders(String(user?.id));
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="section">
      {/* Profile card */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/15 text-gold font-serif text-xl flex items-center justify-center shrink-0 font-medium">
            {initials}
          </div>
          <div>
            <p className="eyebrow mb-0.5">My Account</p>
            <h1 className="font-serif text-2xl text-charcoal tracking-tight">{user?.name}</h1>
            <p className="text-sm text-charcoal-muted">{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-outline flex items-center gap-2 text-sm">
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Order history */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Package size={18} className="text-charcoal-muted" />
          <h2 className="font-serif text-2xl text-charcoal tracking-tight">Order History</h2>
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="card p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone flex items-center justify-center">
              <ShoppingBag size={20} className="text-charcoal-light" />
            </div>
            <div>
              <p className="font-serif text-xl text-charcoal mb-1">No orders yet</p>
              <p className="text-sm text-charcoal-muted">Start shopping your favorite furniture pieces.</p>
            </div>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <article key={order.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-charcoal text-sm">Order #{order.id}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-charcoal-muted">
                      <span>{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      <span>·</span>
                      <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
                      {order.couponCode && (
                        <>
                          <span>·</span>
                          <span className="text-success">Coupon: {order.couponCode}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1 text-sm">
                    <span className="font-serif text-xl text-charcoal">${order.total.toFixed(2)}</span>
                    <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                      <span>Subtotal ${order.subtotal.toFixed(2)}</span>
                      {order.shippingFee > 0 && <span>+ ${order.shippingFee.toFixed(2)} shipping</span>}
                      {order.discountAmount > 0 && <span className="text-success">- ${order.discountAmount.toFixed(2)} off</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
