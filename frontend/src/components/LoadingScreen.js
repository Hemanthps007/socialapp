/**
 * LoadingScreen.js — Full-page splash shown while restoring auth session
 */
import React from "react";
import "./LoadingScreen.css";

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-brand">
      <span className="loading-icon">◈</span>
      <span className="loading-text">Pulse</span>
    </div>
    <div className="loading-spinner" />
  </div>
);

export default LoadingScreen;
