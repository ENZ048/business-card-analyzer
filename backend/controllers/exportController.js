const {
  generateVCF,
  generateBulkVCF,
  generateCSV,
  generateVCFQR,
  generateXLSX,
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

    const csvData = generateCSV(contacts, fields);

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

// Single card QR (return as base64 JSON) - Single contact only
async function getVCFQR(req, res) {
  try {
    const { contact, contacts } = req.body;
    
    let vcfContent;
    let filename = "contact.vcf";
    
    // Only allow single contact QR codes
    if (contacts && Array.isArray(contacts)) {
      if (contacts.length > 1) {
        return res.status(400).json({ 
          error: "QR codes are only available for single contacts",
          message: "Please select only one contact to generate a QR code. For multiple contacts, use the VCF download option instead.",
          suggestion: "Select a single contact from your processed results to generate a QR code."
        });
      } else if (contacts.length === 1) {
        // Single contact in array - safe for QR
        vcfContent = generateVCF(contacts[0]);
        filename = "contact.vcf";
      } else {
        return res.status(400).json({ error: "No contacts provided" });
      }
    } else if (contact) {
      // Single contact object - safe for QR
      vcfContent = generateVCF(contact);
      filename = "contact.vcf";
    } else {
      return res.status(400).json({ error: "Either 'contact' or 'contacts' array must be provided" });
    }

    const qrData = await generateVCFQR({ vcfContent, filename });
    res.json({ qrData, filename });
  } catch (err) {
    console.error("QR code export error:", err);
    res.status(500).json({ error: "QR code export failed" });
  }
}

// XLSX export with enhanced styling
async function downloadXLSX(req, res) {
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
    console.log("🔍 Debug - Fields parameter:", fields);
    console.log("🔍 Debug - Field type:", typeof fields);
    console.log("🔍 Debug - Is fields array:", Array.isArray(fields));

    const xlsxBuffer = generateXLSX(contacts, fields);

    // DEBUG: Log buffer info
    console.log("🔍 Debug - XLSX buffer size:", xlsxBuffer.length);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=business_cards.xlsx"
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(xlsxBuffer);
  } catch (err) {
    console.error("XLSX export error:", err);
    res.status(500).json({ error: "XLSX export failed" });
  }
}

module.exports = { 
  downloadVCF, 
  downloadBulkVCF, 
  downloadCSV, 
  getVCFQR,
  downloadXLSX
};
