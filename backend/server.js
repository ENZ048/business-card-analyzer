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

// Trust proxy so secure cookies work behind nginx/Load balancer
// (nginx terminates TLS and forwards requests to this app)
app.set("trust proxy", 1);

// ---------- Middlewares ----------
// CORS configuration for production
const corsOptions = {
  origin: [
    "http://localhost:5173",           // local dev (Vite default port)
    "http://localhost:3000",           // local dev (alternative)
    "https://login.superscanai.com",   // React UI (production)
    "https://api.superscanai.com",     // API origin (if needed)
    "https://superscanai.com",         // WordPress root (optional)
    "https://www.superscanai.com",
    "https://login.superscanai.com"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Use env-based CORS
if (process.env.NODE_ENV === "production") {
  app.use(cors(corsOptions));
} else {
  // In dev allow local dev origin and credentials
  app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
}

// Increase body size limits for file uploads
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));
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
// Default to the build_login folder you created earlier; allow overriding via env
const buildPath = process.env.FRONTEND_BUILD_PATH
  || path.join(__dirname, "..", "frontend", "build_login"); // matches your build path

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath, { maxAge: "30d" }));
}

// ---------- Default API root (health) ----------
app.get("/api", (req, res) => {
  return res.json({ ok: true, msg: "Super Scanner Backend API" });
});

// ---------- Root route & SPA fallback ----------
// Serve index.html for non-API requests if build present
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

// ---------- Helper: set auth cookie (example) ----------
// Use this function in your auth route after successful login to set cookie correctly.
// Example usage:
//   setAuthCookie(res, token);
function setAuthCookie(res, token, opts = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: true,                  // requires HTTPS (nginx will handle TLS)
    sameSite: "none",              // allow cross-site cookies between subdomains
    domain: ".superscanai.com",    // cookie valid for all subdomains
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    ...opts
  };
  res.cookie("token", token, cookieOptions);
}

// Export helper if you want to use in controllers
module.exports.setAuthCookie = setAuthCookie;

// ---------- Error Handling Middleware ----------
// Global error handler for multer and other upload errors
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large. Maximum file size is 300MB per file. Please compress your image or use a smaller file.',
      code: 'FILE_TOO_LARGE',
      maxFileSize: '300MB',
      suggestion: 'Try compressing your image using online tools or reducing the image resolution.'
    });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files. Maximum 100 files allowed.',
      code: 'TOO_MANY_FILES'
    });
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected field name in file upload.',
      code: 'UNEXPECTED_FIELD'
    });
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      error: 'Only image files (JPEG, PNG, GIF, BMP, WebP) are allowed.',
      code: 'INVALID_FILE_TYPE'
    });
  }
  next(error);
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
