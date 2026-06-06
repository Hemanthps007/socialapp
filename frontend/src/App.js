/**
 * ============================================================
 * App.js — Root component with route definitions
 * ------------------------------------------------------------
 * Route structure:
 *   /         → Feed (public, but prompts login to interact)
 *   /login    → Login page
 *   /signup   → Signup page
 *   *         → Redirect to /
 *
 * ProtectedRoute: redirects to /login if not authenticated.
 * ============================================================
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Page components
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Layout component
import Navbar from "./components/Navbar";
import LoadingScreen from "./components/LoadingScreen";

// ── ProtectedRoute: wraps routes that require login ────────
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  // If not logged in, redirect to login page
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── PublicOnlyRoute: redirect logged-in users away from auth pages ──
const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  // Already logged in? Go to feed
  if (user) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const { loading } = useAuth();

  // Show a splash screen while restoring session from localStorage
  if (loading) return <LoadingScreen />;

  return (
    <div className="app-wrapper">
      {/* Navbar persists across all pages */}
      <Navbar />

      {/* Main content area */}
      <main className="main-content">
        <Routes>
          {/* Feed is accessible to all, but interaction requires login */}
          <Route path="/" element={<Feed />} />

          {/* Auth pages — redirect if already logged in */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          {/* Catch-all: redirect unknown URLs to feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
