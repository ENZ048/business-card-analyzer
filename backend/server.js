require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { wss } = require("./wsServer");
const ocrRoutes = require("./routes/ocrRoutes");
const exportRoutes = require("./routes/exportRoutes");

const app = express();
const server = http.createServer(app);

// ---------- Middlewares ----------
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ---------- Routes ----------
app.use("/api/ocr", ocrRoutes);
app.use("/api/export", exportRoutes);

// ---------- Default Route ----------
app.get("/", (req, res) => {
  res.send("✅ Business Card OCR Backend Running");
});

// ---------- WebSocket Upgrade ----------
server.on("upgrade", (req, socket, head) => {
  // You can authenticate user here via JWT, cookies, or query param
  const userId = new URL(req.url, `http://${req.headers.host}`).searchParams.get("userId");
  if (!userId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, userId);
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
