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
    const { contact, contacts } = req.body;
    
    let vcfContent;
    let filename = "contact.vcf";
    
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      // Bulk mode: generate QR for multiple contacts
      vcfContent = generateBulkVCF(contacts);
      filename = `contacts_${contacts.length}.vcf`;
      
      // DEBUG: Log bulk VCF generation
      console.log("🔍 QR Debug - Bulk mode activated");
      console.log("🔍 QR Debug - Number of contacts:", contacts.length);
      console.log("🔍 QR Debug - VCF content length:", vcfContent.length);
      console.log("🔍 QR Debug - VCF content preview (first 500 chars):", vcfContent.substring(0, 500));
      console.log("🔍 QR Debug - VCF content preview (last 500 chars):", vcfContent.substring(Math.max(0, vcfContent.length - 500)));
    } else if (contact) {
      // Single mode: generate QR for one contact
      vcfContent = generateVCF(contact);
      filename = "contact.vcf";
      
      // DEBUG: Log single VCF generation
      console.log("🔍 QR Debug - Single mode activated");
      console.log("🔍 QR Debug - VCF content length:", vcfContent.length);
      console.log("🔍 QR Debug - VCF content preview:", vcfContent);
    } else {
      return res.status(400).json({ error: "Either 'contact' or 'contacts' array must be provided" });
    }

    const qrData = await generateVCFQR({ vcfContent, filename }); // Pass VCF content directly
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
