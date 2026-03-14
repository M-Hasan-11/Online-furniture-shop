import { ArrowRight, Search, Truck, ShieldCheck, Sparkles, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { CatalogSkeleton } from "../components/Skeletons";
import { useAuth } from "../contexts/AuthContext";
import { getProducts, getRecommendations } from "../lib/db";
import type { Product } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";

const categories = ["All", "Sofas", "Chairs", "Tables", "Beds", "Storage", "Lighting"];

export function HomePage() {
  usePageMeta("Home", "Curated premium furniture for modern living. Browse our handcrafted collection.");

  const { user } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationReason, setRecommendationReason] = useState("Popular picks for your home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname !== "/shop") return;
    const t = window.setTimeout(() => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 70);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProducts({ category: selectedCategory, sort, search: search.trim() || undefined });
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, selectedCategory, sort]);

  useEffect(() => {
    const loadRec = async () => {
      try {
        const rec = await getRecommendations(user ? String(user.id) : undefined);
        setRecommendedProducts(rec.products.slice(0, 4));
        setRecommendationReason(rec.reason || "Popular picks for your home");
      } catch {
        setRecommendedProducts([]);
      }
    };
    loadRec();
  }, [user]);

  const featuredProducts = useMemo(() => products.filter((p) => p.isFeatured).slice(0, 4), [products]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-warm-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="flex flex-col gap-6 max-w-xl">
            <span className="eyebrow">Made for elevated living</span>
            <h1 className="font-serif text-[clamp(2.4rem,4.5vw,4.8rem)] leading-[1.05] tracking-tight text-charcoal">
              Furniture That Feels Like Home,{" "}
              <em className="not-italic text-gold">Looks Like Art.</em>
            </h1>
            <p className="text-charcoal-muted text-lg leading-relaxed">
              Discover handcrafted sofas, statement tables, and modern essentials designed
              for comfort, warmth, and timeless style.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#catalog" className="btn-primary">
                Explore Collection <ArrowRight size={15} />
              </a>
              <Link to="/account" className="btn-outline">
                View Orders
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-card)] aspect-[4/5] lg:aspect-auto lg:h-[540px]">
            <img
              src="https://images.pexels.com/photos/6207944/pexels-photo-6207944.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Modern living room"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-charcoal/70 to-transparent">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-warm-white/70 text-xs uppercase tracking-wider mb-0.5">New</p>
                  <strong className="text-warm-white font-serif text-lg">2026 Signature Collection</strong>
                </div>
                <span className="text-gold font-serif text-lg">from $199</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div className="border-t border-b border-warm-gray bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-warm-gray">
          {[
            { icon: <Truck size={16} />, text: "Free delivery over $1,000" },
            { icon: <ShieldCheck size={16} />, text: "30-day easy returns" },
            { icon: <Sparkles size={16} />, text: "Premium curated catalog" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2.5 py-3 sm:py-0 text-sm text-charcoal-muted">
              <span className="text-gold">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Catalog ── */}
      <section className="section" id="catalog">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-1">Shop Furniture</p>
            <h2 className="font-serif text-[clamp(1.6rem,2.5vw,2.4rem)] text-charcoal tracking-tight">
              Curated Favorites
            </h2>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-light pointer-events-none" />
            <input
              className="form-input pl-9 rounded-full"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={
                  selectedCategory === cat
                    ? "px-4 py-2 rounded-full text-xs font-semibold bg-charcoal text-warm-white transition-all"
                    : "px-4 py-2 rounded-full text-xs font-semibold border border-warm-gray text-charcoal-muted hover:border-charcoal hover:text-charcoal transition-all"
                }
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-charcoal-muted">
            <SlidersHorizontal size={13} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-warm-gray rounded-full px-3 py-2 text-xs text-charcoal bg-white focus:outline-none focus:border-gold cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {loading && <CatalogSkeleton />}

        {error && (
          <div className="py-20 text-center text-charcoal-muted">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="py-20 text-center text-charcoal-muted">
            <p className="font-serif text-xl text-charcoal mb-2">No products found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Featured ── */}
      {featuredProducts.length > 0 && (
        <section className="section border-t border-warm-gray">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-1">Editor's Pick</p>
              <h2 className="font-serif text-[clamp(1.6rem,2.5vw,2.4rem)] text-charcoal tracking-tight">
                Featured Best Sellers
              </h2>
            </div>
            <a href="#catalog" className="text-sm text-charcoal-muted hover:text-charcoal flex items-center gap-1 transition-colors">
              View all <ArrowRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={`featured-${p.id}`} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recommendations ── */}
      {recommendedProducts.length > 0 && (
        <section className="section border-t border-warm-gray">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-1">{user ? "For You" : "Trending"}</p>
              <h2 className="font-serif text-[clamp(1.6rem,2.5vw,2.4rem)] text-charcoal tracking-tight">
                {user ? "Recommended For You" : "Popular Right Now"}
              </h2>
              {recommendationReason && (
                <p className="text-sm text-charcoal-muted mt-1">{recommendationReason}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((p) => (
              <ProductCard key={`rec-${p.id}`} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
