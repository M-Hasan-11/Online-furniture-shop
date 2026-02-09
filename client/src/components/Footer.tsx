export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Atelier Furnish</h3>
          <p>
            Curated furniture for modern homes. Designed for comfort, crafted for daily
            living.
          </p>
        </div>
        <div>
          <h4>Support</h4>
          <p>Email: support@atelierfurnish.com</p>
          <p>Phone: +1 (555) 901-2210</p>
        </div>
        <div>
          <h4>Shipping</h4>
          <p>Free shipping over $1,000.</p>
          <p>30-day return policy.</p>
        </div>
      </div>
      <div className="footer-bottom">(c) {new Date().getFullYear()} Atelier Furnish</div>
    </footer>
  );
}