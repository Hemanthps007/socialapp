/**
 * ============================================================
 * routes/posts.js — Post endpoints
 * ------------------------------------------------------------
 * GET    /api/posts              — Paginated public feed
 * POST   /api/posts              — Create a new post (auth required)
 * DELETE /api/posts/:id          — Delete own post (auth required)
 * POST   /api/posts/:id/like     — Toggle like on a post (auth required)
 * POST   /api/posts/:id/comment  — Add a comment (auth required)
 * DELETE /api/posts/:postId/comment/:commentId — Remove comment (auth)
 * ============================================================
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ============================================================
// Multer Configuration — handles multipart/form-data uploads
// ============================================================

// Ensure uploads directory exists (multer won't create it)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// DiskStorage: control where and how files are saved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save to /backend/uploads/
  },
  filename: (req, file, cb) => {
    // Prefix with timestamp to avoid name collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

// File type validation — only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only JPEG, PNG, GIF, and WEBP images are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// ============================================================
// GET /api/posts
// Query params: page (default 1), limit (default 10)
// Returns paginated posts, newest first
// ============================================================
router.get("/", async (req, res) => {
  try {
    // Parse pagination params from query string
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10); // Cap at 20 per page
    const skip = (page - 1) * limit;

    // Fetch posts sorted by newest first, with pagination
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Descending order — newest first
      .skip(skip)
      .limit(limit);
      // Note: No .populate() needed since we denormalized username/avatarColor

    // Count total posts for pagination metadata
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
});

// ============================================================
// POST /api/posts — Create a new post (PROTECTED)
// Body (multipart/form-data): text? (string), image? (file)
// At least one of text or image must be provided.
// ============================================================
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    const imageFile = req.file; // Multer populates this if a file was uploaded

    // ── Validation: at least one content field is required ──
    if (!text?.trim() && !imageFile) {
      // If multer saved an image but validation fails, clean up the file
      if (imageFile) fs.unlinkSync(imageFile.path);
      return res.status(400).json({ message: "Post must have text or an image." });
    }

    // ── Build the post document ─────────────────────────
    const newPost = await Post.create({
      author: req.user.id,
      username: req.user.username,         // Denormalized from JWT payload
      avatarColor: req.user.avatarColor,   // Denormalized from JWT payload
      text: text?.trim() || undefined,
      image: imageFile ? imageFile.filename : null,
    });

    res.status(201).json({
      message: "Post created successfully! 🎉",
      post: newPost,
    });
  } catch (err) {
    // If multer threw a file-type error, it arrives as an Error object
    if (err.message?.includes("Only")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Create post error:", err);
    res.status(500).json({ message: "Failed to create post." });
  }
});

// ============================================================
// POST /api/posts/:id/like — Toggle like (PROTECTED)
// Adds user to likes array if not present, removes if present (toggle)
// ============================================================
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const userId = req.user.id;
    // Check if this user already liked the post
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      // ── Unlike: remove user from likes array ──────────
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // ── Like: add user to likes array ─────────────────
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Post unliked." : "Post liked! ❤️",
      likes: post.likes,
      likesCount: post.likes.length,
      liked: !alreadyLiked, // New like state
    });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ message: "Failed to update like." });
  }
});

// ============================================================
// POST /api/posts/:id/comment — Add comment (PROTECTED)
// Body: { text }
// ============================================================
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // ── Build comment sub-document and push to post ───
    const newComment = {
      author: req.user.id,
      username: req.user.username,
      avatarColor: req.user.avatarColor,
      text: text.trim(),
    };

    post.comments.push(newComment);
    await post.save();

    // Return the last comment (the one just added) for instant UI update
    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: "Comment added! 💬",
      comment: addedComment,
      commentsCount: post.comments.length,
    });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Failed to add comment." });
  }
});

// ============================================================
// DELETE /api/posts/:postId/comment/:commentId (PROTECTED)
// Only the comment author can delete their comment
// ============================================================
router.delete("/:postId/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found." });

    // Find the comment inside the post's comments array
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    // Authorization: only the comment's author can delete it
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    comment.deleteOne(); // Mongoose subdocument method
    await post.save();

    res.json({ message: "Comment deleted.", commentsCount: post.comments.length });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Failed to delete comment." });
  }
});

// ============================================================
// DELETE /api/posts/:id — Delete post (PROTECTED)
// Only the post author can delete their post
// ============================================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    // Authorization check
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }

    // If the post had an image, delete the file from disk too
    if (post.image) {
      const imagePath = path.join(__dirname, "../uploads", post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Remove orphaned image file
      }
    }

    await post.deleteOne();

    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Failed to delete post." });
  }
});

module.exports = router;
