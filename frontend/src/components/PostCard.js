/**
 * ============================================================
 * components/PostCard.js — Individual post in the feed
 * ------------------------------------------------------------
 * Props:
 *   post     — post document from MongoDB
 *   currentUser — logged-in user (null if not logged in)
 *   onLike   — callback(postId) when like toggled
 *   onComment — callback(postId, text) when comment submitted
 *   onDelete — callback(postId) when post deleted
 *   onDeleteComment — callback(postId, commentId)
 * ============================================================
 */

import React, { useState, useRef } from "react";
import "./PostCard.css";

// ── Helper: format relative time ──────────────────────────
const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  // Fall back to date string for older posts
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const PostCard = ({ post, currentUser, onLike, onComment, onDelete, onDeleteComment }) => {
  // ── Local state ─────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const commentInputRef = useRef(null);

  // ── Derived state ────────────────────────────────────────
  // Check if the current user already liked this post
  const isLiked = currentUser
    ? post.likes.some((id) => id === currentUser.id || id._id === currentUser.id)
    : false;

  const likesCount = post.likes.length;
  const commentsCount = post.comments.length;

  // ── Handle like click with animation ────────────────────
  const handleLike = () => {
    if (!currentUser) return; // Silently ignore — UI shows login prompt
    setLikeAnimating(true);
    onLike(post._id);
    // Remove animation class after it completes
    setTimeout(() => setLikeAnimating(false), 400);
  };

  // ── Handle comment submission ────────────────────────────
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    await onComment(post._id, commentText.trim());
    setCommentText(""); // Clear input on success
    setSubmitting(false);
  };

  // ── Focus comment input when opening comments ────────────
  const handleToggleComments = () => {
    const opening = !showComments;
    setShowComments(opening);
    if (opening && currentUser) {
      // Small delay to let the DOM expand first
      setTimeout(() => commentInputRef.current?.focus(), 150);
    }
  };

  return (
    <article className="post-card">

      {/* ── Post Header: avatar + username + timestamp ─── */}
      <header className="post-header">
        <div className="post-author-info">
          <span
            className="avatar-circle"
            style={{ backgroundColor: post.avatarColor }}
            aria-label={`${post.username}'s avatar`}
          >
            {post.username[0].toUpperCase()}
          </span>
          <div className="post-meta">
            <span className="post-username">{post.username}</span>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* ── Delete button (only shown to post author) ── */}
        {currentUser && currentUser.id === post.author && (
          <button
            className="post-delete-btn"
            onClick={() => onDelete(post._id)}
            title="Delete post"
            aria-label="Delete post"
          >
            ✕
          </button>
        )}
      </header>

      {/* ── Post Body: text content ──────────────────────── */}
      {post.text && (
        <p className="post-text">{post.text}</p>
      )}

      {/* ── Post Image ───────────────────────────────────── */}
      {post.image && (
        <div
          className={`post-image-wrapper ${imageExpanded ? "expanded" : ""}`}
          onClick={() => setImageExpanded((e) => !e)}
        >
          <img
            src={`/uploads/${post.image}`}
            alt="Post attachment"
            className="post-image"
            loading="lazy" /* Native lazy loading for performance */
          />
          <div className="post-image-overlay">
            <span>{imageExpanded ? "✕" : "⤢"}</span>
          </div>
        </div>
      )}

      {/* ── Action Bar: like + comment counts ───────────── */}
      <div className="post-actions">
        <button
          className={`icon-btn like-btn ${isLiked ? "active" : ""} ${likeAnimating ? "animating" : ""}`}
          onClick={handleLike}
          title={currentUser ? (isLiked ? "Unlike" : "Like") : "Login to like"}
          disabled={!currentUser}
        >
          <span className="like-icon">{isLiked ? "♥" : "♡"}</span>
          <span className="action-count">{likesCount > 0 ? likesCount : ""}</span>
          <span className="action-label">{likesCount === 1 ? "like" : "likes"}</span>
        </button>

        <button
          className={`icon-btn comment-btn ${showComments ? "active-comment" : ""}`}
          onClick={handleToggleComments}
        >
          <span>💬</span>
          <span className="action-count">{commentsCount > 0 ? commentsCount : ""}</span>
          <span className="action-label">{commentsCount === 1 ? "comment" : "comments"}</span>
        </button>
      </div>

      {/* ── Comments Section (collapsible) ──────────────── */}
      {showComments && (
        <div className="comments-section">

          {/* ── Existing comments list ────────────────── */}
          {post.comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first!</p>
          ) : (
            <ul className="comments-list">
              {post.comments.map((comment) => (
                <li key={comment._id} className="comment-item">
                  <span
                    className="avatar-circle sm"
                    style={{ backgroundColor: comment.avatarColor }}
                  >
                    {comment.username[0].toUpperCase()}
                  </span>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-username">{comment.username}</span>
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>

                  {/* Delete own comment */}
                  {currentUser && currentUser.id === comment.author && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => onDeleteComment(post._id, comment._id)}
                      title="Delete comment"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* ── Add comment form (only for logged-in users) ── */}
          {currentUser ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <span
                className="avatar-circle sm"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.username[0].toUpperCase()}
              </span>
              <div className="comment-input-wrapper">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                  className="comment-input"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={!commentText.trim() || submitting}
                  aria-label="Submit comment"
                >
                  {submitting ? "…" : "↑"}
                </button>
              </div>
            </form>
          ) : (
            <p className="login-prompt">
              <a href="/login">Sign in</a> to join the conversation.
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;
