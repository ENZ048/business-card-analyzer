const WebSocket = require("ws");

const wss = new WebSocket.Server({ noServer: true });

// Store active clients
global.wssClients = {}; // { userId: ws }

wss.on("connection", (ws, req, userId) => {
  console.log("🔌 WebSocket connected:", userId);
  global.wssClients[userId] = ws;

  ws.on("close", () => {
    console.log("❌ WebSocket closed:", userId);
    delete global.wssClients[userId];
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});

module.exports = { wss };
