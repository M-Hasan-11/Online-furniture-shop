import { LayoutDashboard, Heart, House, ShoppingBag, Store, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface MobileNavItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  end?: boolean;
}

function MobileNavItem({ to, label, icon, badge, end }: MobileNavItemProps) {
  return (
    <NavLink
      className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
      end={end}
      to={to}
    >
      <span className="mobile-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mobile-nav-label">{label}</span>
      {badge && badge > 0 && (
        <span className="mobile-nav-badge" aria-label={`${badge} items`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
}

export function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
      <MobileNavItem end icon={<House size={18} />} label="Home" to="/" />
      <MobileNavItem icon={<Store size={18} />} label="Shop" to="/shop" />
      <MobileNavItem
        badge={wishlistCount}
        icon={<Heart size={18} />}
        label="Wishlist"
        to="/wishlist"
      />
      <MobileNavItem badge={cartCount} icon={<ShoppingBag size={18} />} label="Cart" to="/cart" />
      {isAdmin ? (
        <MobileNavItem icon={<LayoutDashboard size={18} />} label="Admin" to="/admin" />
      ) : (
        <MobileNavItem icon={<UserRound size={18} />} label="Account" to={user ? "/account" : "/login"} />
      )}
    </nav>
  );
}
