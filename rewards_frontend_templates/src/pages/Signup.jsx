import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { register } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refFromUrl = params.get("ref") || params.get("referral") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    referralCode: refFromUrl,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailOk = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || "").trim()),
    [form.email]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const referralCode = String(form.referralCode || "").trim();

    if (!name) return setError("Name is required.");
    if (!email) return setError("Email is required.");
    if (!emailOk) return setError("Please enter a valid email address.");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      await register({ name, email, password, referralCode });
      navigate("/login", { replace: true, state: { email } });
    } catch (err) {
      setError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Create account" subtitle="Name, email, referral code and password.">
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>
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
          <label>Referral code (optional)</label>
          <input
            value={form.referralCode}
            onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value }))}
            placeholder="BD-XXXXXX"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Create password"
            autoComplete="new-password"
          />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="below">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

