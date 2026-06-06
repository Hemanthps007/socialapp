/**
 * ============================================================
 * models/User.js — Mongoose schema for the "users" collection
 * ------------------------------------------------------------
 * Fields:
 *   username  — unique display name shown on posts
 *   email     — unique login identifier
 *   password  — bcrypt-hashed password (never stored as plain text)
 *   avatar    — optional profile color/emoji (stored as string)
 *   createdAt — auto-timestamp from Mongoose
 * ============================================================
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Schema Definition ──────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // Store emails in lowercase for consistent lookups
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // A hex color used to generate an avatar circle in the UI
    avatarColor: {
      type: String,
      default: () => {
        // Randomly assign a vibrant color on registration
        const colors = ["#e63946", "#2a9d8f", "#e9c46a", "#264653", "#f4a261", "#6a4c93", "#1982c4"];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Pre-save Hook: Hash password before storing ────────────
// This runs every time a User document is saved (only rehashes if password changed)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password didn't change

  const salt = await bcrypt.genSalt(10); // 10 rounds is the recommended balance
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method: Compare plain password with stored hash ──
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
