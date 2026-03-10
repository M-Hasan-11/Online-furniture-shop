import { Heart, HeartOff, Minus, Plus, Star, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { ProductDetailSkeleton } from "../components/Skeletons";
import api from "../lib/api";
import type { Product } from "../lib/types";
import { usePageMeta } from "../hooks/usePageMeta";

interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function extractApiMessage(error: unknown, fallback: string): string {
  if (
    error && typeof error === "object" && "response" in error &&
    error.response && typeof error.response === "object" && "data" in error.response &&
    error.response.data && typeof error.response.data === "object" && "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return fallback;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={22}
            className={
              star <= (hover || value)
                ? "fill-gold text-gold"
                : "text-warm-gray fill-warm-gray"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  usePageMeta(product?.name ?? "Product", product?.description?.slice(0, 120));

  const ownReview = useMemo(
    () => (user ? reviews.find((r) => r.userId === user.id) : null),
    [reviews, user]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [pRes, rRes] = await Promise.all([
          api.get<{ product: Product }>(`/products/${id}`),
          api.get<{ reviews: Review[] }>(`/products/${id}/reviews`),
        ]);
        setProduct(pRes.data.product);
        setReviews(rRes.data.reviews);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (ownReview) {
      setReviewRating(ownReview.rating);
      setReviewComment(ownReview.comment);
    } else {
      setReviewRating(5);
      setReviewComment("");
    }
  }, [ownReview]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <p className="text-charcoal-muted mb-4">{error ?? "Product unavailable."}</p>
        <Link to="/" className="btn-primary">Back to shop</Link>
      </div>
    );
  }

  const wished = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to leave a review."); return; }
    if (reviewComment.trim().length < 3) { toast.error("Comment must be at least 3 characters."); return; }
    try {
      setReviewSubmitting(true);
      const { data } = await api.post<{ review: Review }>(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === data.review.id);
        if (exists) return prev.map((r) => (r.id === data.review.id ? data.review : r));
        return [data.review, ...prev];
      });
      const refreshed = await api.get<{ product: Product }>(`/products/${product.id}`);
      setProduct(refreshed.data.product);
      toast.success(ownReview ? "Review updated." : "Thanks for your review!");
    } catch (err) {
      toast.error(extractApiMessage(err, "Unable to submit review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const metaItems = [
    { label: "Rating", value: `${product.rating.toFixed(1)} / 5 (${product.reviewCount} reviews)` },
    { label: "Material", value: product.material || "Premium composite" },
    { label: "Dimensions", value: product.dimensions || "See description" },
    { label: "Color", value: product.color || "Neutral" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-charcoal-muted hover:text-charcoal transition-colors mb-8">
        <ArrowLeft size={14} /> Back to shop
      </Link>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Image */}
        <div className="rounded-3xl overflow-hidden bg-stone aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Details — sticky on desktop */}
        <div className="lg:sticky lg:top-28 flex flex-col gap-6">
          {/* Category + title */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold border border-gold/30 rounded-full px-3 py-1 self-start">
              {product.category}
            </span>
            <h1 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] text-charcoal tracking-tight leading-[1.1]">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(product.rating) ? "fill-gold text-gold" : "text-warm-gray fill-warm-gray"}
                  />
                ))}
              </div>
              <span className="text-xs text-charcoal-muted">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <p className="font-serif text-3xl text-charcoal">${product.price.toFixed(2)}</p>

          {/* Description */}
          <p className="text-sm text-charcoal-muted leading-relaxed">{product.description}</p>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {metaItems.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-stone border border-warm-gray p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light mb-1">{label}</p>
                <p className="text-sm font-medium text-charcoal">{value}</p>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-charcoal-muted">Qty</span>
            <div className="flex items-center gap-3 border border-warm-gray rounded-full px-4 py-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal disabled:opacity-30 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="font-medium text-charcoal w-4 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal disabled:opacity-30 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            {product.stock < 10 && product.stock > 0 && (
              <span className="text-xs text-amber-600">Only {product.stock} left</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock < 1}
              className="btn-primary flex-1"
            >
              {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={() => void toggleWishlist(product)}
              className={`icon-btn w-12 h-12 rounded-full shrink-0 ${wished ? "border-gold text-gold bg-gold/10" : ""}`}
              aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            >
              {wished ? <HeartOff size={16} /> : <Heart size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-20 pt-12 border-t border-warm-gray">
        <div className="mb-8">
          <p className="eyebrow mb-1">Customer Feedback</p>
          <h2 className="font-serif text-[clamp(1.4rem,2vw,2rem)] text-charcoal tracking-tight">
            Customer Reviews
            <span className="ml-3 text-charcoal-light font-sans text-sm font-normal">
              {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
            </span>
          </h2>
        </div>

        {reviews.length === 0 && (
          <p className="text-sm text-charcoal-muted py-6">No reviews yet. Be the first to share your thoughts.</p>
        )}

        {reviews.length > 0 && (
          <div className="flex flex-col gap-4 mb-10">
            {reviews.map((review) => (
              <article key={review.id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/15 text-gold font-serif font-medium text-sm flex items-center justify-center shrink-0">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{review.userName}</p>
                      <p className="text-xs text-charcoal-light">
                        {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13} className={s <= review.rating ? "fill-gold text-gold" : "text-warm-gray fill-warm-gray"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-charcoal-muted leading-relaxed">{review.comment}</p>
              </article>
            ))}
          </div>
        )}

        {/* Review form */}
        <div className="card p-6 max-w-xl">
          <h3 className="font-serif text-xl text-charcoal mb-5">
            {ownReview ? "Update Your Review" : "Write a Review"}
          </h3>

          {!user ? (
            <p className="text-sm text-charcoal-muted">
              <Link to="/login" className="text-gold hover:underline">Sign in</Link> to post a review.
            </p>
          ) : (
            <form onSubmit={submitReview} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Your Rating</label>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
              </div>
              <div>
                <label className="form-label">Your Comment</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How is the quality, comfort, and finish?"
                  required
                  className="form-input resize-none"
                />
              </div>
              <button type="submit" disabled={reviewSubmitting} className="btn-primary self-start">
                {reviewSubmitting ? "Submitting…" : ownReview ? "Update Review" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
