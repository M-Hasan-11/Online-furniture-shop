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
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">A</span>
          <span>Atelier Furnish</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/">Home</NavLink>
          <a href="/#catalog">Shop</a>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/account">Account</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/wishlist" className="icon-button" aria-label="Wishlist">
            <Heart size={18} />
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="icon-button" aria-label="Open cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <Link to={user ? "/account" : "/login"} className="icon-button" aria-label="Profile">
            <UserRound size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
