require("dotenv").config();
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

// Use environment-based CORS
app.use(cors(process.env.NODE_ENV === 'production' ? corsOptions : { origin: "*", credentials: true }));
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
/*
  Assumes your React build is at ../frontend/build (relative to backend/)
  After building frontend, frontend/build/index.html must exist.
*/
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath, { maxAge: "30d" }));

// ---------- Default API root (health) ----------
app.get("/api", (req, res) => {
  return res.json({ ok: true, msg: "Super Scanner Backend API" });
});

// ---------- Root route & SPA fallback ----------
// Keep a small root message if build is not present. If build exists, serve it.
app.get("/", (req, res, next) => {
  // if the frontend build exists, serve index.html
  const indexFile = path.join(buildPath, "index.html");
  // If request explicitly asks for API, skip
  if (req.path.startsWith("/api")) return next();

  // If build exists, serve SPA
  try {
    return res.sendFile(indexFile);
  } catch (err) {
    // fallback to simple text when build not available
    return res.send("✅ Super Scanner Backend Running");
  }
});

// SPA fallback for client-side routes (must be after API routes)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const indexFile = path.join(buildPath, "index.html");
  return res.sendFile(indexFile);
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
