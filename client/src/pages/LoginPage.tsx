import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";

export function LoginPage() {
  usePageMeta("Sign In");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      toast.error("Login failed. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-warm-gray p-10"
        style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Header */}
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center text-warm-white font-serif text-base font-bold mb-5">
            A
          </div>
          <h1 className="font-serif text-3xl text-charcoal tracking-tight">Welcome back</h1>
          <p className="text-sm text-charcoal-muted mt-2">Sign in to continue your shopping experience.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-charcoal-muted text-center mt-6">
          New here?{" "}
          <Link to="/register" className="text-gold hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
