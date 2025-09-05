require("dotenv").config();
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const ocrRoutes = require("./routes/ocrRoutes");
const exportRoutes = require("./routes/exportRoutes");

const app = express();
const server = http.createServer(app);

// ---------- Middlewares ----------
// When serving frontend from same origin you can restrict CORS or remove it.
// During local testing, keeping origin: "*" is fine.
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ---------- API Routes ----------
app.use("/api/ocr", ocrRoutes);
app.use("/api/export", exportRoutes);

// ---------- Serve frontend build (static) ----------
/*
  Assumes your React build is at ../frontend/build (relative to backend/)
  After building frontend, frontend/build/index.html must exist.
*/
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath, { maxAge: "30d" }));

// ---------- Default API root (health) ----------
app.get("/api", (req, res) => {
  return res.json({ ok: true, msg: "Business Card OCR Backend API" });
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
    return res.send("✅ Business Card OCR Backend Running");
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
