const express = require("express");
const router = express.Router();
const multer = require("multer");
const { processBusinessCardWS } = require("../controllers/ocrController");

const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "files", maxCount: 50 }, // for bulk
  ]),
  processBusinessCardWS
);

module.exports = router;
