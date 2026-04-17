// src/config/api.js
export const BASE_URL = __DEV__ 
    ? "http://192.168.1.6:8080" // Fallback back to local IP for dev testing if needed
    : "https://chat-app-4nat.onrender.com";

// Enforce production mode for this task
// You can remove or toggle this line when you want to test locally again
export const ACTIVE_BASE_URL = "https://chat-app-4nat.onrender.com";
