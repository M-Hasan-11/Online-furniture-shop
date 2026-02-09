import { Heart, HeartOff, Minus, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { ProductDetailSkeleton } from "../components/Skeletons";
import api from "../lib/api";
import type { Product } from "../lib/types";

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
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
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
  const [reviewState, setReviewState] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const ownReview = useMemo(
    () => (user ? reviews.find((review) => review.userId === user.id) : null),
    [reviews, user]
  );

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productRes, reviewsRes] = await Promise.all([
          api.get<{ product: Product }>(`/products/${id}`),
          api.get<{ reviews: Review[] }>(`/products/${id}/reviews`),
        ]);

        setProduct(productRes.data.product);
        setReviews(reviewsRes.data.reviews);
      } catch {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
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

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="container page-state error">
        {error || "Product unavailable."} <Link to="/">Back to shop</Link>
      </div>
    );
  }

  const wished = isWishlisted(product.id);

  const addToCartAction = () => {
    addToCart(product, quantity);
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      setReviewState("Please login to submit a review.");
      return;
    }

    if (reviewComment.trim().length < 3) {
      setReviewState("Review comment must be at least 3 characters.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewState(null);

      const { data } = await api.post<{ review: Review }>(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviews((prev) => {
        const existing = prev.some((item) => item.id === data.review.id);
        if (existing) {
          return prev.map((item) => (item.id === data.review.id ? data.review : item));
        }
        return [data.review, ...prev];
      });

      const refreshedProduct = await api.get<{ product: Product }>(`/products/${product.id}`);
      setProduct(refreshedProduct.data.product);
      setReviewState(ownReview ? "Review updated." : "Thanks for your review.");
    } catch (err) {
      setReviewState(extractApiMessage(err, "Unable to submit review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <div className="product-detail reveal">
        <img src={product.image} alt={product.name} className="detail-image" />

        <div>
          <span className="category-pill">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">${product.price.toFixed(2)}</p>
          <p className="detail-copy">{product.description}</p>

          <div className="detail-meta">
            <div>
              <span>Rating</span>
              <strong>
                <Star size={14} /> {product.rating.toFixed(1)} ({product.reviewCount})
              </strong>
            </div>
            <div>
              <span>Material</span>
              <strong>{product.material || "Premium composite"}</strong>
            </div>
            <div>
              <span>Dimensions</span>
              <strong>{product.dimensions || "See description"}</strong>
            </div>
            <div>
              <span>Color</span>
              <strong>{product.color || "Neutral"}</strong>
            </div>
          </div>

          <div className="qty-wrap">
            <button
              className="icon-button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button
              className="icon-button"
              onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="product-detail-actions">
            <button className="btn" onClick={addToCartAction} disabled={product.stock < 1}>
              {product.stock < 1 ? "Out of stock" : "Add to Cart"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void toggleWishlist(product)}
              type="button"
            >
              {wished ? <HeartOff size={16} /> : <Heart size={16} />}
              {wished ? "Remove Wishlist" : "Save Wishlist"}
            </button>
          </div>
        </div>
      </div>

      <div className="reviews-section reveal">
        <div className="reviews-headline">
          <h2>Customer Reviews</h2>
          <p>
            {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"} for this product
          </p>
        </div>

        {reviews.length === 0 && (
          <div className="page-state">No reviews yet. Be the first to share your thoughts.</div>
        )}

        {reviews.length > 0 && (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-top">
                  <strong>{review.userName}</strong>
                  <span>
                    <Star size={14} /> {review.rating}
                  </span>
                </div>
                <p>{review.comment}</p>
                <small>{new Date(review.createdAt).toLocaleString()}</small>
              </article>
            ))}
          </div>
        )}

        <div className="review-form-wrap">
          <h3>{ownReview ? "Update Your Review" : "Write a Review"}</h3>
          {!user && (
            <p>
              <Link to="/login">Sign in</Link> to post a review.
            </p>
          )}

          {user && (
            <form className="review-form" onSubmit={submitReview}>
              <label>
                Rating
                <select
                  className="select"
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </label>

              <label>
                Comment
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="How is the quality, comfort, and finish?"
                  required
                />
              </label>

              {reviewState && (
                <p className={reviewState.toLowerCase().includes("unable") || reviewState.toLowerCase().includes("must") || reviewState.toLowerCase().includes("login") ? "form-error" : "coupon-success"}>
                  {reviewState}
                </p>
              )}

              <button className="btn" type="submit" disabled={reviewSubmitting}>
                {reviewSubmitting ? "Submitting..." : ownReview ? "Update Review" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
