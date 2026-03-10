import { Link } from "react-router-dom";
import { Instagram, Twitter, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-charcoal text-warm-white/80 mt-24">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-warm-white/10">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center text-charcoal text-xs font-serif font-bold">
                A
              </span>
              <span className="font-serif text-lg text-warm-white tracking-tight">
                Atelier Furnish
              </span>
            </div>
            <p className="text-sm text-warm-white/50 leading-relaxed max-w-xs">
              Curated furniture for modern homes. Designed for comfort, crafted for daily living.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-warm-white/15 flex items-center justify-center text-warm-white/50 hover:text-warm-white hover:border-warm-white/40 transition-all"
              >
                <Instagram size={14} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-8 h-8 rounded-full border border-warm-white/15 flex items-center justify-center text-warm-white/50 hover:text-warm-white hover:border-warm-white/40 transition-all"
              >
                <Twitter size={14} />
              </a>
            </div>
          </div>

          {/* Support column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-white/40 mb-1">
              Support
            </h4>
            <a href="mailto:support@atelierfurnish.com" className="text-sm text-warm-white/60 hover:text-warm-white transition-colors">
              support@atelierfurnish.com
            </a>
            <a href="tel:+15559012210" className="text-sm text-warm-white/60 hover:text-warm-white transition-colors">
              +1 (555) 901-2210
            </a>
            <div className="flex flex-col gap-2 mt-2">
              <Link to="/shop" className="text-sm text-warm-white/60 hover:text-warm-white transition-colors flex items-center gap-1 group">
                Browse collection <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link to="/account" className="text-sm text-warm-white/60 hover:text-warm-white transition-colors flex items-center gap-1 group">
                My account <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Policies column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-white/40 mb-1">
              Policies
            </h4>
            <p className="text-sm text-warm-white/60">
              Free shipping on orders over $1,000.
            </p>
            <p className="text-sm text-warm-white/60">
              30-day hassle-free returns.
            </p>
            <p className="text-sm text-warm-white/60">
              2-year craftsmanship warranty.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-white/30">
          <span>&copy; {new Date().getFullYear()} Atelier Furnish. All rights reserved.</span>
          <span>Crafted with care.</span>
        </div>
      </div>
    </footer>
  );
}
