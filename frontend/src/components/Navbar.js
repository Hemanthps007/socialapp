/**
 * ============================================================
 * components/Navbar.js — Top navigation bar
 * ------------------------------------------------------------
 * Shows: App logo, current user avatar + username, logout button
 * On mobile: collapses to logo + icon-only actions
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">

        {/* ── Brand Logo ─────────────────────────────────── */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">Pulse</span>
        </Link>

        {/* ── Right Side ─────────────────────────────────── */}
        <div className="navbar-right">
          {user ? (
            <>
              {/* User avatar pill */}
              <button
                className="user-pill"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="User menu"
              >
                <span
                  className="avatar-circle sm"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.username[0].toUpperCase()}
                </span>
                <span className="user-pill-name">{user.username}</span>
                <span className="chevron">{menuOpen ? "▲" : "▼"}</span>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <span
                      className="avatar-circle"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.username[0].toUpperCase()}
                    </span>
                    <div>
                      <div className="nav-dropdown-name">{user.username}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item danger" onClick={handleLogout}>
                    <span>⎋</span> Sign out
                  </button>
                </div>
              )}

              {/* Backdrop to close dropdown */}
              {menuOpen && (
                <div
                  className="nav-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
              )}
            </>
          ) : (
            /* Auth links for logged-out users */
            <div className="nav-auth-links">
              <Link
                to="/login"
                className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
              >
                Sign in
              </Link>
              <Link to="/signup" className="nav-cta">
                Join Pulse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
