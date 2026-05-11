import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const preset = location.state?.email;
    if (preset) setForm((p) => ({ ...p, email: preset }));
  }, [location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");

    if (!email) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Welcome back" subtitle="Sign in to play the weekly game.">
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="below">
          New here? <Link to="/signup">Create account</Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

