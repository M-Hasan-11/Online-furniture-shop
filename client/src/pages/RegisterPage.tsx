import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";

export function RegisterPage() {
  usePageMeta("Create Account");

  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await register(name, email, password);
      navigate("/account", { replace: true });
    } catch {
      toast.error("Registration failed. Try a different email.");
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
          <h1 className="font-serif text-3xl text-charcoal tracking-tight">Create account</h1>
          <p className="text-sm text-charcoal-muted mt-2">Join to save your orders and checkout faster.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Jane Smith"
            />
          </div>
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
              minLength={6}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-charcoal-muted text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
