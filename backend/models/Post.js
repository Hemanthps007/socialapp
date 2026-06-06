/**
 * ============================================================
 * models/Post.js — Mongoose schema for the "posts" collection
 * ------------------------------------------------------------
 * Fields:
 *   author    — reference to the User who created this post
 *   text      — optional text content of the post
 *   image     — optional filename of uploaded image
 *   likes     — array of User ObjectIds who liked this post
 *   comments  — embedded array of comment sub-documents
 *   createdAt — auto-timestamp
 *
 * Note: At least one of (text, image) must be present.
 *       This is enforced in the route handler, not the schema.
 * ============================================================
 */

const mongoose = require("mongoose");

// ── Comment Sub-document Schema ────────────────────────────
// Comments are embedded inside posts (no separate collection needed)
const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",       // Reference to the User model for populate()
      required: true,
    },
    username: {
      type: String,
      required: true,    // Denormalized for fast display without extra lookups
    },
    avatarColor: {
      type: String,
      default: "#264653",
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },
  },
  {
    timestamps: true, // Each comment gets its own createdAt
  }
);

// ── Post Schema ────────────────────────────────────────────
const PostSchema = new mongoose.Schema(
  {
    // Who wrote this post
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Denormalized username and avatar to avoid extra join on feed load
    username: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      default: "#264653",
    },

    // Optional text content — at least one of text/image must exist
    text: {
      type: String,
      maxlength: [1000, "Post text cannot exceed 1000 characters"],
      trim: true,
    },

    // Optional image — stored as a filename relative to /uploads/
    image: {
      type: String,
      default: null,
    },

    // Array of User ObjectIds — tracks who liked (prevents double-liking in logic)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Embedded comments array using the CommentSchema above
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

// ── Virtual: likesCount — derived field (not stored in DB) ──
PostSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

// ── Virtual: commentsCount ─────────────────────────────────
PostSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

module.exports = mongoose.model("Post", PostSchema);
