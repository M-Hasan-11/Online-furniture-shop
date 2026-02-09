import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="container section">
      <div className="page-state error">
        Page not found. <Link to="/">Return home</Link>
      </div>
    </section>
  );
}