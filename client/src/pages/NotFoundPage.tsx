import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFoundPage() {
  usePageMeta("404 — Page Not Found");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-5 px-6">
      <p className="font-serif leading-none text-warm-gray select-none" style={{ fontSize: "clamp(5rem,18vw,10rem)" }}>
        404
      </p>
      <div className="flex flex-col gap-2 max-w-sm">
        <h1 className="font-serif text-2xl text-charcoal tracking-tight">Page not found</h1>
        <p className="text-sm text-charcoal-muted leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
      </div>
      <Link to="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
