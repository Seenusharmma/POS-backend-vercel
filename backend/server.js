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
        "https://food-fantasy-ten.vercel.app",
        "https://foodfantasy-in.vercel.app",
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

// ✅ MongoDB Connection
connectDB()
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Middleware
app.use(
  cors({
    origin: [
      "https://food-fantasy-ten.vercel.app",
      "https://foodfantasy-in.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Store Socket.IO instance in app for route access
app.set("io", io);

// ✅ Attach Socket.IO to every request (so req.io works inside routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ API Routes
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);

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

// ✅ 404 Handler
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
