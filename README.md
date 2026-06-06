# ◈ Pulse — Mini Social Post Application

A full-stack social posting app inspired by TaskPlanet's social feed. Built with **React.js**, **Node.js + Express**, and **MongoDB**.

---

## Features

- **Account system** — Signup/login with JWT authentication, bcrypt-hashed passwords
- **Create posts** — Text, image (drag & drop), or both
- **Public feed** — All posts from all users, newest first
- **Like/Unlike** — Toggle likes with optimistic UI updates
- **Comments** — Add and delete comments, visible per post
- **Pagination** — Infinite scroll with IntersectionObserver
- **Responsive** — Works on mobile and desktop

---

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | React.js (CRA), React Router v6, Axios|
| Backend   | Node.js, Express.js                   |
| Database  | MongoDB (Mongoose ODM)                |
| Auth      | JWT (jsonwebtoken) + bcryptjs         |
| Uploads   | Multer (disk storage)                 |
| Styling   | Pure CSS (no Tailwind, no Bootstrap)  |

---

## Project Structure

```
socialapp/
├── backend/
│   ├── models/
│   │   ├── User.js          # Users collection schema
│   │   └── Post.js          # Posts collection schema (with embedded comments)
│   ├── routes/
│   │   ├── auth.js          # POST /signup  POST /login  GET /me
│   │   └── posts.js         # GET / POST /like /comment DELETE
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── uploads/             # Uploaded images saved here (auto-created)
│   ├── server.js            # Express app + MongoDB connection
│   └── .env                 # Environment variables
│
└── frontend/
    ├── public/
    │   └── index.html       # Google Fonts loaded here
    └── src/
        ├── context/
        │   └── AuthContext.js   # Global auth state (useReducer)
        ├── utils/
        │   └── api.js           # All Axios API calls
        ├── components/
        │   ├── Navbar.js/css    # Top navigation bar
        │   ├── PostCard.js/css  # Individual post with like/comment
        │   ├── CreatePost.js/css# Post creation form with image drag/drop
        │   └── LoadingScreen.js/css
        ├── pages/
        │   ├── Feed.js/css      # Main feed with infinite scroll
        │   ├── Login.js         # Login page
        │   ├── Signup.js        # Signup page with password strength
        │   └── Auth.css         # Shared auth page styles
        ├── styles/
        │   └── global.css       # CSS variables, reset, animations
        ├── App.js               # Route definitions
        └── index.js             # React entry point
```

---

## MongoDB Collections

Only **2 collections** are used:

### `users`
```json
{
  "_id": "ObjectId",
  "username": "hemanth",
  "email": "hemanth@example.com",
  "password": "$2b$10$...",      // bcrypt hash
  "avatarColor": "#e63946",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `posts`
```json
{
  "_id": "ObjectId",
  "author": "ObjectId (ref: User)",
  "username": "hemanth",         // denormalized
  "avatarColor": "#e63946",      // denormalized
  "text": "Hello world!",
  "image": "post-1234567890.jpg",
  "likes": ["ObjectId", "ObjectId"],
  "comments": [
    {
      "_id": "ObjectId",
      "author": "ObjectId",
      "username": "alice",
      "avatarColor": "#2a9d8f",
      "text": "Nice post!",
      "createdAt": "..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Setup & Running

### Prerequisites
- Node.js ≥ 16
- MongoDB running locally OR a MongoDB Atlas connection string

### 1. Backend setup

```bash
cd backend
npm install

# Edit .env — set your MONGO_URI and JWT_SECRET
# Default: mongodb://localhost:27017/socialapp

npm run dev    # Development (nodemon)
# or
npm start      # Production
```

Backend runs on: **http://localhost:5000**

### 2. Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

The `"proxy": "http://localhost:5000"` in `package.json` forwards all `/api/*` requests to the backend automatically in development.

---

## API Endpoints

| Method | Endpoint                              | Auth | Description                  |
|--------|---------------------------------------|------|------------------------------|
| POST   | `/api/auth/signup`                    | ✗    | Register new account         |
| POST   | `/api/auth/login`                     | ✗    | Login, get JWT token         |
| GET    | `/api/auth/me`                        | ✓    | Get current user profile     |
| GET    | `/api/posts?page=1&limit=10`          | ✗    | Paginated public feed        |
| POST   | `/api/posts`                          | ✓    | Create post (multipart)      |
| POST   | `/api/posts/:id/like`                 | ✓    | Toggle like on post          |
| POST   | `/api/posts/:id/comment`             | ✓    | Add comment to post          |
| DELETE | `/api/posts/:postId/comment/:id`     | ✓    | Delete own comment           |
| DELETE | `/api/posts/:id`                     | ✓    | Delete own post              |

---

## Design

- **Theme**: Dark editorial — inspired by modern news/magazine design
- **Fonts**: Playfair Display (headings) + DM Sans (body) via Google Fonts
- **Colors**: Ink black background with warm amber accent (`#f5a623`)
- **Animations**: CSS keyframe animations — `fadeInUp`, `pulse` (like), shimmer skeleton
- **No Tailwind** — all styling in plain CSS with CSS Custom Properties

---

## Bonus Features Implemented

- ✅ Optimistic UI updates for likes and comments (instant feedback)
- ✅ Infinite scroll with IntersectionObserver API
- ✅ Skeleton loading cards for perceived performance
- ✅ Drag & drop image upload with preview
- ✅ Password strength indicator on signup
- ✅ Toast notification system
- ✅ Post image expand/collapse on click
- ✅ Character counter ring on post textarea
- ✅ Responsive layout for mobile
- ✅ All code is commented for clarity
