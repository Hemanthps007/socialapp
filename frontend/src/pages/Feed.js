/**
 * ============================================================
 * pages/Feed.js — Main social feed page
 * ------------------------------------------------------------
 * Responsibilities:
 *   1. Load paginated posts from the API on mount
 *   2. Render CreatePost form (if logged in)
 *   3. Render PostCard list with staggered animation
 *   4. Handle like/comment/delete mutations optimistically
 *   5. Infinite scroll OR pagination controls
 * ============================================================
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPosts, toggleLike, addComment, deletePost, deleteComment } from "../utils/api";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import "./Feed.css";

// ── Skeleton card shown during initial load ─────────────────
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-lines">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line xshort" />
      </div>
    </div>
    <div className="skeleton skeleton-line full" />
    <div className="skeleton skeleton-line medium" />
    <div className="skeleton skeleton-line short" />
  </div>
);

// ── Toast notification system ───────────────────────────────
let toastIdCounter = 0;

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Feed state ──────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Intersection observer ref for infinite scroll trigger
  const loadMoreRef = useRef(null);

  // ── Show toast notification ──────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ── Load posts from API ──────────────────────────────────
  const loadPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const data = await fetchPosts(page, 10);

      setPosts((prev) =>
        append ? [...prev, ...data.posts] : data.posts
      );
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setHasNextPage(data.pagination.hasNextPage);
      setError("");
    } catch (err) {
      setError("Failed to load posts. Please refresh.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  // ── Infinite scroll: observe the sentinel element ────────
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
          loadPosts(currentPage + 1, true); // Append next page
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, currentPage, loadPosts]);

  // ── Handle new post created ──────────────────────────────
  // Prepend new post to top of feed without refetching
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    showToast("Post published! 🎉");
  };

  // ── Handle like toggle (optimistic update) ───────────────
  const handleLike = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Optimistic update: toggle immediately in UI
    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;

        const alreadyLiked = post.likes.includes(user.id);
        return {
          ...post,
          likes: alreadyLiked
            ? post.likes.filter((id) => id !== user.id) // Unlike
            : [...post.likes, user.id],                 // Like
        };
      })
    );

    try {
      // Sync with server
      const result = await toggleLike(postId);
      // Update with authoritative server data
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, likes: result.likes } : post
        )
      );
    } catch (err) {
      // Revert on failure
      loadPosts(1, false);
      showToast("Failed to update like.", "error");
    }
  };

  // ── Handle add comment ───────────────────────────────────
  const handleComment = async (postId, text) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const result = await addComment(postId, text);
      // Append new comment to the post in state
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          return {
            ...post,
            comments: [...post.comments, result.comment],
          };
        })
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add comment.", "error");
    }
  };

  // ── Handle delete post ───────────────────────────────────
  const handleDeletePost = async (postId) => {
    // Simple confirmation before destructive action
    if (!window.confirm("Delete this post? This cannot be undone.")) return;

    // Optimistic removal
    setPosts((prev) => prev.filter((p) => p._id !== postId));

    try {
      await deletePost(postId);
      showToast("Post deleted.");
    } catch (err) {
      // Revert if API call fails
      loadPosts(1, false);
      showToast("Failed to delete post.", "error");
    }
  };

  // ── Handle delete comment ────────────────────────────────
  const handleDeleteComment = async (postId, commentId) => {
    // Optimistic removal
    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: post.comments.filter((c) => c._id !== commentId),
        };
      })
    );

    try {
      await deleteComment(postId, commentId);
    } catch (err) {
      loadPosts(1, false);
      showToast("Failed to delete comment.", "error");
    }
  };

  return (
    <div className="feed-page">
      <div className="container">

        {/* ── Page header ──────────────────────────────── */}
        <header className="feed-header">
          <div className="feed-title-block">
            <h1 className="feed-title">The Feed</h1>
            <p className="feed-subtitle">
              {user
                ? `Welcome back, ${user.username} ✦`
                : "Join the conversation — sign up or log in"}
            </p>
          </div>

          {/* Live badge */}
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>
        </header>

        {/* ── Create post form (logged-in users only) ───── */}
        {user ? (
          <CreatePost onPostCreated={handlePostCreated} />
        ) : (
          /* CTA for guests */
          <div className="guest-cta">
            <p className="guest-cta-text">
              Share your thoughts with the world.
            </p>
            <div className="guest-cta-buttons">
              <a href="/signup" className="cta-btn primary">Create account</a>
              <a href="/login" className="cta-btn secondary">Sign in</a>
            </div>
          </div>
        )}

        {/* ── Feed divider ─────────────────────────────── */}
        <div className="feed-divider">
          <span>Recent Posts</span>
        </div>

        {/* ── Error state ──────────────────────────────── */}
        {error && (
          <div className="feed-error">
            <span>⚠ {error}</span>
            <button onClick={() => loadPosts(1, false)} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* ── Initial loading skeletons ─────────────────── */}
        {loading ? (
          <div className="posts-list">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* Empty state */
          <div className="empty-feed">
            <div className="empty-icon">◈</div>
            <h3>No posts yet</h3>
            <p>Be the first to share something amazing.</p>
          </div>
        ) : (
          /* Posts list */
          <div className="posts-list">
            {posts.map((post, index) => (
              <div
                key={post._id}
                // Stagger animation delay based on position
                style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
              >
                <PostCard
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDelete={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                />
              </div>
            ))}

            {/* Infinite scroll sentinel element */}
            <div ref={loadMoreRef} className="scroll-sentinel" aria-hidden="true" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="loading-more">
                <div className="loading-more-spinner" />
                <span>Loading more…</span>
              </div>
            )}

            {/* End of feed message */}
            {!hasNextPage && posts.length > 0 && (
              <div className="end-of-feed">
                <span>◈</span> You've seen it all
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toast notifications ──────────────────────────── */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === "error" ? "error" : ""}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
