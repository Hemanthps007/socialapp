/**
 * ============================================================
 * pages/Login.js — Login form page
 * ------------------------------------------------------------
 * Features:
 *   - Email + password form
 *   - Show/hide password toggle
 *   - Inline error display
 *   - Redirect to feed on success
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../utils/api";
import "./Auth.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Handle form submit ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi(email.trim(), password);

      // Store token + user in context (and localStorage via AuthContext)
      login(data.token, data.user);

      // Navigate to the feed after successful login
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Brand mark ───────────────────────────────── */}
        <div className="auth-brand">
          <span className="auth-brand-icon">◈</span>
          <span className="auth-brand-name">Pulse</span>
        </div>

        {/* ── Heading ──────────────────────────────────── */}
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to continue to your feed</p>
        </div>

        {/* ── Error Banner ─────────────────────────────── */}
        {error && (
          <div className="auth-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              {/* Toggle password visibility */}
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Signing in…</>
            ) : (
              "Sign in →"
            )}
          </button>
        </form>

        {/* ── Footer link ──────────────────────────────── */}
        <p className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Create one
          </Link>
        </p>
      </div>

      {/* Decorative background elements */}
      <div className="auth-bg-decor" aria-hidden="true">
        <div className="decor-circle decor-1" />
        <div className="decor-circle decor-2" />
        <div className="decor-ring" />
      </div>
    </div>
  );
};

export default Login;
