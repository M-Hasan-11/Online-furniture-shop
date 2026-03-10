import { Link, NavLink } from "react-router-dom";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-warm-white/90 border-b border-warm-gray/80">
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-7 h-7 rounded-lg bg-charcoal flex items-center justify-center text-warm-white text-xs font-serif font-bold">
            A
          </span>
          <span className="font-serif text-lg text-charcoal tracking-tight hidden sm:block">
            Atelier Furnish
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "text-sm font-medium text-charcoal border-b-2 border-gold pb-0.5"
                : "text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors pb-0.5 border-b-2 border-transparent"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              isActive
                ? "text-sm font-medium text-charcoal border-b-2 border-gold pb-0.5"
                : "text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors pb-0.5 border-b-2 border-transparent"
            }
          >
            Shop
          </NavLink>
          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              isActive
                ? "text-sm font-medium text-charcoal border-b-2 border-gold pb-0.5"
                : "text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors pb-0.5 border-b-2 border-transparent"
            }
          >
            Wishlist
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive
                  ? "text-sm font-medium text-charcoal border-b-2 border-gold pb-0.5"
                  : "text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors pb-0.5 border-b-2 border-transparent"
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link to="/wishlist" className="icon-btn relative" aria-label="Wishlist">
            <Heart size={17} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="icon-btn relative" aria-label="Cart">
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          <Link
            to={user ? "/account" : "/login"}
            className="icon-btn"
            aria-label="Account"
          >
            <UserRound size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
