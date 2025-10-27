require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Logging setup
const winston = require("winston");
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "business-card-backend" },
  transports: [
    // Write all logs with importance level of 'error' or less to error.log
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Console logging for non-production
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Database connection
const connectDB = require("./config/database");

const ocrRoutes = require("./routes/ocrRoutes");
const exportRoutes = require("./routes/exportRoutes");
const userRoutes = require("./routes/userRoutes");
const planRoutes = require("./routes/planRoutes");
const adminRoutes = require("./routes/adminRoutes");
const appRoutes = require("./routes/appRoutes");

const app = express();
const server = http.createServer(app);

// Set timeout to 30 minutes for long-running OCR operations
server.timeout = 1800000; // 30 minutes in milliseconds
server.keepAliveTimeout = 1800000;
server.headersTimeout = 1810000; // Slightly higher than keepAliveTimeout

// Trust proxy so secure cookies work behind nginx/Load balancer
// (nginx terminates TLS and forwards requests to this app)
app.set("trust proxy", 1);

// ---------- Middlewares ----------
// CORS configuration for production
const corsOptions = {
  origin: [
    "http://localhost:5173",           // local dev (Vite default port)
    "http://localhost:5174",           // local dev (alternative port)
    "http://localhost:3000",           // local dev (alternative)
    "https://login.superscanai.com",   // React UI (production)
    "https://api.superscanai.com",     // API origin (if needed)
    "https://superscanai.com",         // WordPress root (optional)
    "https://www.superscanai.com",
    "https://login.superscanai.com",
    "capacitor://localhost",           // Capacitor mobile app
    "ionic://localhost",               // Ionic mobile app
    "http://localhost",                // Local development
    "https://localhost"                // Local HTTPS development
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // Cache preflight for 24 hours to reduce OPTIONS requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Use env-based CORS with explicit preflight handling
if (process.env.NODE_ENV === "production") {
  app.use(cors(corsOptions));

  // Handle preflight requests explicitly for large file uploads
  app.options('*', cors(corsOptions));
} else {
  // In dev allow local dev origin and credentials + mobile app origins
  const devCorsOptions = { 
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:3000",
      "capacitor://localhost",
      "ionic://localhost",
      "http://localhost",
      "https://localhost"
    ], 
    credentials: true 
  };
  app.use(cors(devCorsOptions));
  app.options('*', cors(devCorsOptions));
}

// Increase body size limits for file uploads
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent")
    };

    if (res.statusCode >= 400) {
      logger.warn("Request completed with error", logData);
    } else {
      logger.info("Request completed", logData);
    }
  });

  next();
});

// ---------- Connect to Database ----------
connectDB();

// ---------- API Routes ----------
app.use("/api/ocr", ocrRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/app", appRoutes);

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
  // Log the error with context
  logger.error("Application error", {
    error: error.message,
    stack: error.stack,
    code: error.code,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
    body: req.body ? JSON.stringify(req.body).substring(0, 500) : undefined
  });

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

  // Generic error response
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message,
    code: error.code || "INTERNAL_ERROR"
  });
});

// ---------- Uncaught Exception & Rejection Handlers ----------
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack
  });
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  });
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(reason);
  server.close(() => {
    process.exit(1);
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

server.listen(PORT, HOST, () => {
  logger.info(`Server started on http://${HOST}:${PORT}`, {
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    host: HOST
  });
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

// Export logger for use in other modules
module.exports.logger = logger;
