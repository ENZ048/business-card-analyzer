const {
  generateVCF,
  generateBulkVCF,
  generateCSV,
  generateVCFQR,
} = require("../services/exportService");

// Single card VCF
async function downloadVCF(req, res) {
  try {
    const contact = req.body.contact;
    if (!contact) {
      return res.status(400).json({ error: "No contact provided" });
    }

    const vcf = generateVCF(contact);

    res.setHeader("Content-Disposition", "attachment; filename=contact.vcf");
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.send(vcf);
  } catch (err) {
    console.error("VCF export error:", err);
    res.status(500).json({ error: "VCF export failed" });
  }
}

// Bulk cards VCF
async function downloadBulkVCF(req, res) {
  try {
    const contacts = req.body.contacts;
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: "No contacts provided" });
    }

    const vcf = generateBulkVCF(contacts);

    res.setHeader("Content-Disposition", "attachment; filename=contacts.vcf");
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.send(vcf);
  } catch (err) {
    console.error("Bulk VCF export error:", err);
    res.status(500).json({ error: "Bulk VCF export failed" });
  }
}

// Bulk CSV
// In your downloadCSV function, add this debug code:
async function downloadCSV(req, res) {
  try {
    const { contacts, fields } = req.body;
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: "No contacts provided" });
    }

    // DEBUG: Log the first contact to see if websites field exists
    console.log(
      "🔍 Debug - First contact:",
      JSON.stringify(contacts[0], null, 2)
    );
    console.log("🔍 Debug - Websites field:", contacts[0]?.websites);

    const csvData = generateCSV(contacts, fields);

    // DEBUG: Log first few lines of CSV
    console.log("🔍 Debug - CSV preview:", csvData.split("\n").slice(0, 3));

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=business_cards.csv"
    );
    res.setHeader("Content-Type", "text/csv");
    res.send(csvData);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ error: "CSV export failed" });
  }
}

// Single card QR (return as base64 JSON)
async function getVCFQR(req, res) {
  try {
    const contact = req.body.contact;
    if (!contact) {
      return res.status(400).json({ error: "No contact provided" });
    }

    const qrData = await generateVCFQR(contact); // returns base64 string
    res.json({ qrData });
  } catch (err) {
    console.error("QR code export error:", err);
    res.status(500).json({ error: "QR code export failed" });
  }
}

module.exports = { downloadVCF, downloadBulkVCF, downloadCSV, getVCFQR };
