import { LayoutDashboard, Heart, House, ShoppingBag, Store, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { cn } from "../lib/cn";

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
      end={end}
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-all relative px-2",
          isActive
            ? "text-gold bg-gold/10"
            : "text-charcoal-muted hover:text-charcoal"
        )
      }
    >
      <span className="relative" aria-hidden="true">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-gold text-white text-[8px] font-bold flex items-center justify-center leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">{label}</span>
    </NavLink>
  );
}

export function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed left-3 right-3 bottom-[calc(0.6rem+env(safe-area-inset-bottom,0px))] z-50 h-[68px] rounded-2xl bg-white/95 backdrop-blur-lg border border-warm-gray shadow-[0_18px_40px_rgba(28,28,30,0.12)] grid grid-cols-5 items-center px-1 md:hidden"
    >
      <MobileNavItem end icon={<House size={18} />} label="Home" to="/" />
      <MobileNavItem icon={<Store size={18} />} label="Shop" to="/shop" />
      <MobileNavItem
        badge={wishlistCount}
        icon={<Heart size={18} />}
        label="Saves"
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
