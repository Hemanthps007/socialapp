/**
 * ============================================================
 * utils/api.js — Centralized API call functions
 * ------------------------------------------------------------
 * All HTTP requests to the backend go through this module.
 * Benefits:
 *   - Single place to change the base URL
 *   - Consistent error handling pattern
 *   - Easier to mock in tests
 * ============================================================
 */

import axios from "axios";

// Base URL — uses CRA proxy in dev (pointing to localhost:5000)
const BASE = "/api";

// ── Auth API calls ─────────────────────────────────────────

/**
 * Register a new user account
 * @param {string} username
 * @param {string} email
 * @param {string} password
 */
export const signup = async (username, email, password) => {
  const { data } = await axios.post(`${BASE}/auth/signup`, { username, email, password });
  return data; // { token, user, message }
};

/**
 * Login with email + password
 * @param {string} email
 * @param {string} password
 */
export const login = async (email, password) => {
  const { data } = await axios.post(`${BASE}/auth/login`, { email, password });
  return data; // { token, user, message }
};

// ── Posts API calls ────────────────────────────────────────

/**
 * Fetch paginated posts feed
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Posts per page
 */
export const fetchPosts = async (page = 1, limit = 10) => {
  const { data } = await axios.get(`${BASE}/posts?page=${page}&limit=${limit}`);
  return data; // { posts: [...], pagination: {...} }
};

/**
 * Create a new post with optional image upload
 * @param {FormData} formData - Contains text? and image? (File)
 */
export const createPost = async (formData) => {
  const { data } = await axios.post(`${BASE}/posts`, formData, {
    headers: { "Content-Type": "multipart/form-data" }, // Required for file upload
  });
  return data; // { post, message }
};

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 * @param {string} postId - MongoDB ObjectId of the post
 */
export const toggleLike = async (postId) => {
  const { data } = await axios.post(`${BASE}/posts/${postId}/like`);
  return data; // { likes, likesCount, liked, message }
};

/**
 * Add a comment to a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @param {string} text - Comment text content
 */
export const addComment = async (postId, text) => {
  const { data } = await axios.post(`${BASE}/posts/${postId}/comment`, { text });
  return data; // { comment, commentsCount, message }
};

/**
 * Delete a comment from a post
 * @param {string} postId
 * @param {string} commentId
 */
export const deleteComment = async (postId, commentId) => {
  const { data } = await axios.delete(`${BASE}/posts/${postId}/comment/${commentId}`);
  return data;
};

/**
 * Delete a post (own posts only)
 * @param {string} postId
 */
export const deletePost = async (postId) => {
  const { data } = await axios.delete(`${BASE}/posts/${postId}`);
  return data;
};
