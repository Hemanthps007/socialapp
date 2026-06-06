/**
 * ============================================================
 * components/CreatePost.js — Post creation form
 * ------------------------------------------------------------
 * Features:
 *   - Text textarea with character counter
 *   - Image file picker with preview + remove
 *   - At least one field required validation
 *   - Loading state during upload
 *   - Drag-and-drop visual area for images
 * ============================================================
 */

import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../utils/api";
import "./CreatePost.css";

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();

  // ── Form state ──────────────────────────────────────────
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const MAX_CHARS = 1000;

  // ── Handle image selection (file input or drag) ──────────
  const handleImageSelect = (file) => {
    if (!file) return;

    // Client-side size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    // Client-side type check
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and WebP are supported.");
      return;
    }

    setImageFile(file);
    setError("");

    // Generate a local preview URL using FileReader
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Drag & Drop handlers ─────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageSelect(file);
  };

  // ── Remove selected image ────────────────────────────────
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Form submission ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // At least one content field required
    if (!text.trim() && !imageFile) {
      setError("Please add some text or an image to your post.");
      return;
    }

    setLoading(true);

    try {
      // Build FormData — required for multipart file upload
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (imageFile) formData.append("image", imageFile);

      const { post } = await createPost(formData);

      // Notify parent Feed to prepend new post instantly
      onPostCreated(post);

      // Reset form
      setText("");
      removeImage();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const charPercent = (text.length / MAX_CHARS) * 100;
  const nearLimit = text.length > MAX_CHARS * 0.85;

  return (
    <div className="create-post-card">

      {/* ── User avatar + textarea row ─────────────────── */}
      <div className="create-post-top">
        <span
          className="avatar-circle lg"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.username[0].toUpperCase()}
        </span>

        <div className="create-post-right">
          {/* Text area */}
          <textarea
            className="create-post-textarea"
            placeholder={`What's on your mind, ${user.username}?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_CHARS}
            rows={3}
            disabled={loading}
          />

          {/* Character counter */}
          {text.length > 0 && (
            <div className="char-counter-wrapper">
              {/* SVG circle progress */}
              <svg className="char-ring" viewBox="0 0 24 24" width="20" height="20">
                <circle
                  cx="12" cy="12" r="9"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="2"
                />
                <circle
                  cx="12" cy="12" r="9"
                  fill="none"
                  stroke={nearLimit ? "var(--danger)" : "var(--accent)"}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 9}`}
                  strokeDashoffset={`${2 * Math.PI * 9 * (1 - charPercent / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                  style={{ transition: "stroke-dashoffset 0.2s ease" }}
                />
              </svg>
              {nearLimit && (
                <span className={`char-remaining ${nearLimit ? "warn" : ""}`}>
                  {MAX_CHARS - text.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Image Preview ───────────────────────────────── */}
      {imagePreview && (
        <div className="image-preview-wrapper">
          <img src={imagePreview} alt="Preview" className="image-preview" />
          <button
            className="image-remove-btn"
            onClick={removeImage}
            type="button"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Drag drop zone (visible when no image selected) ── */}
      {!imagePreview && (
        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Click or drag to add an image"
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <span className="drop-zone-icon">🖼</span>
          <span className="drop-zone-text">
            {dragOver ? "Drop to add image" : "Add photo"}
          </span>
        </div>
      )}

      {/* ── Hidden file input ────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleImageSelect(e.target.files[0])}
      />

      {/* ── Error message ────────────────────────────────── */}
      {error && <p className="create-post-error">{error}</p>}

      {/* ── Footer: action buttons ───────────────────────── */}
      <div className="create-post-footer">
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Attach image"
        >
          <span>📎</span> Photo
        </button>

        <button
          className="submit-post-btn"
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && !imageFile)}
        >
          {loading ? (
            <span className="btn-spinner" />
          ) : (
            "Publish ↗"
          )}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
