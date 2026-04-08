import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth-route.js";
import userRoutes from "./routes/user-route.js";
import petitionRoutes from "./routes/petition-route.js";
import signatureRoutes from "./routes/signature-route.js";
import pollRoutes from "./routes/poll-route.js";
import adminLogRoutes from "./routes/adminLog-route.js";
import settingsRoutes from './routes/settings-route.js';
import feedbackRoutes from './routes/feedback-route.js';
import commentRoutes from './routes/comment-route.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "civix-eta.vercel.app",
  // http://localhost:5173
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Routes
console.log('Registering routes...');
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/petitions", petitionRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin-logs", adminLogRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/comments", commentRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export default app;