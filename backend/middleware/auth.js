/**
 * ============================================================
 * middleware/auth.js — JWT verification middleware
 * ------------------------------------------------------------
 * Usage: Add `authMiddleware` before any route handler that
 *        requires a logged-in user.
 *
 * Flow:
 *   1. Extract token from Authorization header ("Bearer <token>")
 *   2. Verify signature using JWT_SECRET
 *   3. Attach decoded user payload to req.user
 *   4. Call next() to proceed to the route handler
 * ============================================================
 */

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // ── Step 1: Extract token from header ───────────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided — client must login first
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  // Token format: "Bearer eyJ..." — we only need the part after the space
  const token = authHeader.split(" ")[1];

  try {
    // ── Step 2: Verify and decode the token ───────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Step 3: Attach user info to request for downstream use ──
    // decoded contains: { id, username, avatarColor, iat, exp }
    req.user = decoded;

    // ── Step 4: Continue to the route handler ─────────────
    next();
  } catch (err) {
    // Token is expired or tampered with
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

module.exports = authMiddleware;
