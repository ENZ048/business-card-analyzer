require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Database connection
const connectDB = require("./config/database");

const ocrRoutes = require("./routes/ocrRoutes");
const exportRoutes = require("./routes/exportRoutes");
const userRoutes = require("./routes/userRoutes");
const planRoutes = require("./routes/planRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);

// ---------- Middlewares ----------
// CORS configuration for production
const corsOptions = {
  origin: [
    "http://localhost:3000", // Development
    "https://superscanai.com", // Production WordPress site
    "https://www.superscanai.com", // Production with www
    "https://app.superscanai.com" // If using subdomain approach
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Use env-based CORS
if (process.env.NODE_ENV === "production") {
  app.use(cors(corsOptions));
} else {
  // In dev allow the dev origin and allow credentials
  app.use(cors({ origin: true, credentials: true }));
}

app.use(express.json());
app.use(cookieParser());

// ---------- Connect to Database ----------
connectDB();

// ---------- API Routes ----------
app.use("/api/ocr", ocrRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/admin", adminRoutes);

// ---------- Serve frontend build (static) ----------
// Prefer explicit env var to avoid path mismatch in production
const buildPath = process.env.FRONTEND_BUILD_PATH
  || path.join(__dirname, "..", "frontend", "dist"); // change if your actual build path differs

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath, { maxAge: "30d" }));
}

// ---------- Default API root (health) ----------
app.get("/api", (req, res) => {
  return res.json({ ok: true, msg: "Super Scanner Backend API" });
});

// ---------- Root route & SPA fallback ----------
app.get("/", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  const indexFile = path.join(buildPath, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.send("✅ Super Scanner Backend Running");
});

// SPA fallback for client-side routes (must be after API routes)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  const indexFile = path.join(buildPath, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.status(404).send("Not Found");
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
