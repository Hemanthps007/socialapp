/**
 * ============================================================
 * context/AuthContext.js — Global Authentication State
 * ------------------------------------------------------------
 * Provides user data and auth actions (login, logout, signup)
 * to all components via React Context API.
 *
 * Pattern: Context + useReducer for predictable state updates.
 *
 * Usage in any component:
 *   const { user, login, logout, loading } = useAuth();
 * ============================================================
 */

import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";

// ── Create the context object ──────────────────────────────
const AuthContext = createContext(null);

// ── Auth Reducer: handles state transitions ────────────────
// State shape: { user: null | {id, username, email, avatarColor}, loading: bool, error: string }
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };

    case "LOGOUT":
      return { ...state, user: null, loading: false, error: null };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
};

// ── Initial state ──────────────────────────────────────────
const initialState = {
  user: null,
  loading: true, // True on mount while we check localStorage
  error: null,
};

// ── AuthProvider: wraps the entire app ────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── On app load: restore session from localStorage ──────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      // Set default Authorization header for all future axios calls
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      dispatch({ type: "LOGIN_SUCCESS", payload: JSON.parse(savedUser) });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ── login: store token + user, update axios headers ─────
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    // All future axios requests will include this header automatically
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    dispatch({ type: "LOGIN_SUCCESS", payload: userData });
  };

  // ── logout: clear storage and reset axios headers ───────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    dispatch({ type: "LOGOUT" });
  };

  // ── setError: surface API error messages to UI ───────────
  const setError = (message) => {
    dispatch({ type: "SET_ERROR", payload: message });
  };

  const contextValue = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    setError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook: useAuth — convenient accessor ─────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
