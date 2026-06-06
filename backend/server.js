/**
 * ============================================================
 * server.js — Entry point for the Social Post App backend
 * ------------------------------------------------------------
 * Responsibilities:
 *   1. Load environment variables from .env
 *   2. Connect to MongoDB via Mongoose
 *   3. Register global middleware (CORS, JSON parsing, static files)
 *   4. Mount API route groups
 *   5. Start the HTTP server on PORT
 * ============================================================
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ── Route modules ─────────────────────────────────────────
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ──────────────────────────────────────

// Allow cross-origin requests from the React dev server
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Parse incoming JSON bodies
app.use(express.json());

// Serve uploaded images as static files at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);   // /api/auth/signup  /api/auth/login
app.use("/api/posts", postRoutes);  // /api/posts  /api/posts/:id/like  etc.

// ── Health Check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Social App API is running 🚀" });
});

// ── MongoDB Connection ─────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    // Start listening only after DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process if DB fails — nothing works without it
  });
