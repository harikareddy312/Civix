// src/services/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://civix-engagement.onrender.com";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage - FIXED LOGIC
    let token = localStorage.getItem("token");

    // Fallback: try to get token from user object
    if (!token) {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          token = userData.token || userData.user?.token;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Set Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API Request:", config.method?.toUpperCase(), config.url);
    console.log(
      "Auth header:",
      config.headers.Authorization ? "Present" : "Missing"
    );

    // Log token for debugging (remove in production)
    if (token) {
      console.log("Token present:", token.substring(0, 20) + "...");
    } else {
      console.log("No token found in localStorage");
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API error:", error.response?.data || error);

    // Handle auth errors
    if (error.response?.status === 401) {
      console.error("Unauthorized - redirecting to login");

      // Clear invalid auth data
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const getProfile = async () => {
  try {
    const res = await api.get("/auth/profile");
    return res.data; // expects { user: {...} }
  } catch (err) {
    console.error("Error fetching profile:", err.response?.data?.message);
    throw err;
  }
};
export const getPetitions = async () => {
  try {
    const res = await api.get("/petitions"); // Adjust path if your backend route differs
    return res.data; // e.g., [{ id, title, status, ... }]
  } catch (err) {
    console.error("Error fetching petitions:", err.response?.data || err);
    throw err;
  }
};

export default api;
