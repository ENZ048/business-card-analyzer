const express = require("express");
const router = express.Router();
const {
  downloadVCF,
  downloadBulkVCF,
  downloadCSV,
  getVCFQR,
  downloadXLSX
} = require("../controllers/exportController");

// Single card VCF
router.post("/vcf", downloadVCF);

// Bulk VCF
router.post("/vcf-bulk", downloadBulkVCF);

// Bulk CSV
router.post("/csv", downloadCSV);

// Bulk XLSX (Excel) with enhanced styling
router.post("/xlsx", downloadXLSX);

// QR code (returns JSON { qrData: "data:image/png;base64,..."} )
router.post("/qr", getVCFQR);

module.exports = router;
