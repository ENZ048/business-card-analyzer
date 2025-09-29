const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { processBusinessCard } = require("../controllers/ocrController");

const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB per file
    files: 100, // Maximum 100 files
    fieldSize: 300 * 1024 * 1024, // 300MB field size
    fieldNameSize: 100, // Max field name size
    fieldValueSize: 300 * 1024 * 1024, // 300MB field value size
  },
  fileFilter: (req, file, cb) => {
    // Allow common image formats
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.post(
  "/upload",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "files", maxCount: 100 }, // for bulk (max 100)
  ]),
  (err, req, res, next) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum file size is 300MB per file.',
          code: 'FILE_TOO_LARGE'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Too many files. Maximum 100 files allowed.',
          code: 'TOO_MANY_FILES'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: 'Unexpected field name in file upload.',
          code: 'UNEXPECTED_FIELD'
        });
      }
      return res.status(400).json({ 
        error: 'File upload error: ' + err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    if (err) {
      return res.status(400).json({ 
        error: err.message,
        code: 'UPLOAD_ERROR'
      });
    }
    next();
  },
  processBusinessCard
);

module.exports = router;
