require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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


// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
