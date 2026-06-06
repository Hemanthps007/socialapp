/**
 * ============================================================
 * routes/auth.js — Authentication endpoints
 * ------------------------------------------------------------
 * POST /api/auth/signup  — Register a new user account
 * POST /api/auth/login   — Login and receive a JWT token
 * GET  /api/auth/me      — Get currently logged-in user info
 * ============================================================
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── Helper: Generate JWT token for a user ─────────────────
// Token payload includes id, username, avatarColor for quick access in frontend
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // Token valid for 7 days
  );
};

// ============================================================
// POST /api/auth/signup
// Body: { username, email, password }
// ============================================================
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validate required fields ────────────────────────
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ── Check for duplicate username or email ───────────
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      // Tell the user which field is taken
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ message: "Email is already registered." });
      }
      return res.status(409).json({ message: "Username is already taken." });
    }

    // ── Create and save the new user ────────────────────
    // Password hashing happens in the pre-save hook in User.js
    const newUser = await User.create({ username, email, password });

    // ── Return JWT token immediately (auto-login after signup) ──
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Account created successfully! 🎉",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatarColor: newUser.avatarColor,
      },
    });
  } catch (err) {
    // Mongoose validation errors (e.g., too short username)
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ============================================================
// POST /api/auth/login
// Body: { email, password }
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ── Find user by email ─────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Intentionally vague error to prevent user enumeration
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ── Compare submitted password with hashed password ──
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ── Issue JWT token ────────────────────────────────
    const token = generateToken(user);

    res.json({
      message: "Login successful! Welcome back 👋",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ============================================================
// GET /api/auth/me — Protected route (requires valid JWT)
// Returns the logged-in user's profile info
// ============================================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // req.user was set by authMiddleware — contains { id, username, avatarColor }
    const user = await User.findById(req.user.id).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
