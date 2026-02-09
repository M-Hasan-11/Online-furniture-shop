const catalogSkeletonKeys = Array.from({ length: 8 }, (_, index) => `catalog-skeleton-${index}`);

export function CatalogSkeleton() {
  return (
    <div className="product-grid skeleton-grid" aria-hidden="true">
      {catalogSkeletonKeys.map((key) => (
        <article className="product-card skeleton-card" key={key}>
          <div className="skeleton skeleton-image" />
          <div className="product-body">
            <div className="product-topline">
              <span className="skeleton skeleton-pill" />
              <span className="skeleton skeleton-rating" />
            </div>
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-copy" />
            <span className="skeleton skeleton-copy short" />
            <div className="product-footer">
              <span className="skeleton skeleton-price" />
              <span className="skeleton skeleton-button" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <section aria-busy="true" aria-live="polite" className="container section">
      <div className="product-detail">
        <div className="skeleton skeleton-detail-image" />
        <div className="skeleton-detail-stack" aria-hidden="true">
          <span className="skeleton skeleton-pill" />
          <span className="skeleton skeleton-detail-title" />
          <span className="skeleton skeleton-detail-price" />
          <span className="skeleton skeleton-copy" />
          <span className="skeleton skeleton-copy short" />
          <div className="skeleton-detail-meta-grid">
            <span className="skeleton skeleton-meta" />
            <span className="skeleton skeleton-meta" />
            <span className="skeleton skeleton-meta" />
            <span className="skeleton skeleton-meta" />
          </div>
          <div className="skeleton-actions-row">
            <span className="skeleton skeleton-button-lg" />
            <span className="skeleton skeleton-button-lg" />
          </div>
        </div>
      </div>

      <div className="reviews-section" aria-hidden="true">
        <div className="skeleton skeleton-review-heading" />
        <div className="review-list">
          <div className="review-card">
            <span className="skeleton skeleton-copy" />
            <span className="skeleton skeleton-copy short" />
          </div>
          <div className="review-card">
            <span className="skeleton skeleton-copy" />
            <span className="skeleton skeleton-copy short" />
          </div>
        </div>
      </div>
    </section>
  );
}
