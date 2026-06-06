/**
 * ============================================================
 * pages/Signup.js — Account registration page
 * ------------------------------------------------------------
 * Features:
 *   - Username + email + password + confirm password
 *   - Real-time validation feedback
 *   - Password strength indicator
 *   - Auto-login after successful signup
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signup as signupApi } from "../utils/api";
import "./Auth.css";

// ── Password strength calculation ───────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak",   color: "#e63946" };
  if (score <= 3) return { score, label: "Fair",   color: "#f5a623" };
  return             { score, label: "Strong", color: "#2a9d8f" };
};

const Signup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────
  const [username, setUsername]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  const strength = getPasswordStrength(password);

  // ── Handle submit ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await signupApi(username.trim(), email.trim(), password);

      // Auto-login: store token + user after successful signup
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Brand ────────────────────────────────────── */}
        <div className="auth-brand">
          <span className="auth-brand-icon">◈</span>
          <span className="auth-brand-name">Pulse</span>
        </div>

        {/* ── Heading ──────────────────────────────────── */}
        <div className="auth-heading">
          <h1>Create account</h1>
          <p>Join Pulse and start sharing</p>
        </div>

        {/* ── Error ────────────────────────────────────── */}
        {error && (
          <div className="auth-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="input-wrapper">
              <span className="input-icon">@</span>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="yourhandle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
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

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* Password strength bar */}
            {password && (
              <div className="strength-bar-wrapper">
                <div className="strength-bar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="strength-segment"
                      style={{
                        background: i <= strength.score ? strength.color : "var(--border)",
                        transition: `background 0.3s ease ${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="confirm" className="form-label">
              Confirm password
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                {confirmPassword && confirmPassword === password ? "✓" : "🔒"}
              </span>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                className={`form-input ${
                  confirmPassword && confirmPassword !== password ? "input-error" : ""
                } ${confirmPassword && confirmPassword === password ? "input-success" : ""}`}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Creating account…</>
            ) : (
              "Create account →"
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
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

export default Signup;
