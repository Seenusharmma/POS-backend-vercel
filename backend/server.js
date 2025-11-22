import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRoutes from "./routes/foodRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// ✅ __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by"); // 🔒 Security best practice

// ✅ Check if running on Vercel
const isVercel = process.env.VERCEL === "1";

// ✅ HTTP + WebSocket Server (only for local development)
let server;
let io;

if (!isVercel) {
  // ✅ Local development: Create HTTP server for Socket.IO
  server = createServer(app);

  // ✅ Socket.IO Setup (only works in persistent server environments)
  io = new Server(server, {
    cors: {
      origin: [
        "https://foodfantasy-web.vercel.app",
        "http://localhost:5173",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });
} else {
  // ✅ Vercel: Socket.IO won't work with WebSockets in serverless
  // Create a mock io object that routes can use without errors
  io = {
    on: () => {},
    emit: () => {},
  };
  console.log("⚠️ Running on Vercel - Socket.IO WebSocket features disabled");
}

// ✅ MongoDB Connection (non-blocking for serverless)
// On Vercel, connections are established per request, so we don't block startup
if (!isVercel) {
  // Local development: Connect immediately
  connectDB()
    .then((result) => {
      if (result) {
        console.log("✅ MongoDB connected successfully");
      } else {
        console.warn("⚠️ MongoDB connection returned null, will retry on first request");
      }
    })
    .catch((err) => console.error("❌ MongoDB connection failed:", err));
} else {
  // Vercel: Connection will be established on first request
  console.log("⚠️ Running on Vercel - MongoDB connection will be established per request");
  // Try to establish connection in background (non-blocking)
  connectDB()
    .then((result) => {
      if (result) {
        console.log("✅ MongoDB pre-connected successfully");
      }
    })
    .catch((err) => {
      console.warn("⚠️ MongoDB pre-connection failed, will retry on first request:", err.message);
    });
}

// ✅ Security Headers Middleware (must be before CORS)
app.use((req, res, next) => {
  // ✅ Security Headers to prevent dangerous site warnings
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  // ✅ Strict Transport Security (HSTS) - force HTTPS
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  
  // ✅ Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com; font-src 'self' https://fonts.gstatic.com https://*.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://*.gstatic.com; frame-src 'self' https://*.google.com https://*.firebaseapp.com; frame-ancestors 'none';"
  );
  
  next();
});

// ✅ Middleware
app.use(
  cors({
    origin: [
      "https://foodfantasy-web.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Body parser with increased limits for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Store Socket.IO instance in app for route access
app.set("io", io);

// ✅ Attach Socket.IO to every request (so req.io works inside routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ API Routes (with error handling)
try {
  app.use("/api/foods", foodRoutes);
  app.use("/api/orders", orderRoutes);
} catch (error) {
  console.error("❌ Error setting up routes:", error);
}

// ✅ Socket.IO Event Handling (only in local development)
if (!isVercel && io) {
  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // 🔁 Realtime events
    socket.on("orderUpdated", (updatedOrder) => {
      io.emit("orderStatusChanged", updatedOrder);
    });

    socket.on("foodUpdated", (food) => {
      io.emit("foodUpdated", food);
    });

    socket.on("foodDeleted", (id) => {
      io.emit("foodDeleted", id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
}

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("🍽️ Food Fantasy Backend is running successfully!");
});

// ✅ Global error handler for unhandled errors (must be before 404 handler)
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ✅ 404 Handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.originalUrl}`,
  });
});

// ✅ Export app for Vercel serverless functions
// Vercel will use this as the handler for all routes
export default app;

// ✅ Start Server (only when running locally, not on Vercel)
// Vercel doesn't use server.listen(), it uses serverless functions
if (!isVercel && server) {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}
