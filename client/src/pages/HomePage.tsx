import { ArrowRight, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { CatalogSkeleton } from "../components/Skeletons";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import type { Product } from "../lib/types";

const categories = ["All", "Sofas", "Chairs", "Tables", "Beds", "Storage", "Lighting"];

export function HomePage() {
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
    if (location.pathname !== "/shop") {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const section = document.getElementById("catalog");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 70);

    return () => window.clearTimeout(scrollTimer);
  }, [location.pathname]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<{ products: Product[] }>("/products", {
          params: {
            category: selectedCategory,
            sort,
            search: search.trim() || undefined,
          },
        });

        setProducts(data.products);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load products.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [search, selectedCategory, sort]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const { data } = await api.get<{ products: Product[]; reason: string }>("/recommendations");
        setRecommendedProducts(data.products.slice(0, 4));
        setRecommendationReason(data.reason || "Popular picks for your home");
      } catch {
        setRecommendedProducts([]);
      }
    };

    loadRecommendations();
  }, [user]);

  const featuredProducts = useMemo(() => products.filter((item) => item.isFeatured).slice(0, 4), [products]);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="eyebrow">Made for Elevated Living</p>
            <h1>Furniture That Feels Like Home, Looks Like Art.</h1>
            <p>
              Discover handcrafted sofas, statement tables, and modern essentials designed for
              comfort, warmth, and timeless style.
            </p>
            <div className="hero-actions">
              <a href="#catalog" className="btn">
                Explore Collection <ArrowRight size={16} />
              </a>
              <Link to="/account" className="btn btn-secondary">
                View Orders
              </Link>
            </div>
          </div>

          <div className="hero-card reveal">
            <img
              src="https://images.pexels.com/photos/6207944/pexels-photo-6207944.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Modern living room"
            />
            <div className="hero-card-info">
              <strong>2026 Signature Collection</strong>
              <span>Starting at $199</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          <div>
            <Truck size={18} /> Free delivery over $1,000
          </div>
          <div>
            <ShieldCheck size={18} /> 30-day easy returns
          </div>
          <div>
            <Sparkles size={18} /> Premium curated catalog
          </div>
        </div>
      </section>

      <section className="container section" id="catalog">
        <div className="section-header">
          <div>
            <p className="eyebrow">Shop Furniture</p>
            <h2>Curated Favorites</h2>
          </div>
          <input
            className="search-input"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filter-row">
          <div className="chip-group">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "chip chip-active" : "chip"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {loading && <CatalogSkeleton />}
        {error && <div className="page-state error">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="page-state">No products match your filters right now.</div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {featuredProducts.length > 0 && (
        <section className="container section feature-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Editors Pick</p>
              <h2>Featured Best Sellers</h2>
            </div>
          </div>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={`featured-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {recommendedProducts.length > 0 && (
        <section className="container section feature-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">{user ? "For You" : "Trending"}</p>
              <h2>{user ? "Recommended For You" : "Popular Right Now"}</h2>
              <p>{recommendationReason}</p>
            </div>
          </div>
          <div className="product-grid">
            {recommendedProducts.map((product) => (
              <ProductCard key={`recommended-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
