const QRCode = require("qrcode");

// Normalize array-like fields
function normalizeArrayField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return [field];
}

// Generate single VCF string
function generateVCF(contact) {
  const { fullName, jobTitle, company, phones, emails, websites, address } = contact;

  let vcf = `BEGIN:VCARD\nVERSION:3.0\n`;
  if (fullName) vcf += `FN:${fullName}\n`;
  if (jobTitle) vcf += `TITLE:${jobTitle}\n`;
  if (company) vcf += `ORG:${company}\n`;

  normalizeArrayField(phones).forEach((p) => {
    vcf += `TEL;TYPE=CELL:${p}\n`;
  });

  normalizeArrayField(emails).forEach((e) => {
    vcf += `EMAIL;TYPE=WORK:${e}\n`;
  });

  normalizeArrayField(websites).forEach((w) => {
    vcf += `URL:${w}\n`;
  });

  if (address) vcf += `ADR;TYPE=WORK:;;${address}\n`;
  vcf += `END:VCARD\n`;

  return vcf;
}

// Generate bulk VCF (all contacts concatenated)
function generateBulkVCF(contacts) {
  return contacts.map((c) => generateVCF(c)).join("\n");
}

// Generate CSV string
function generateCSV(contacts, fields) {
  let fieldList = Array.isArray(fields)
    ? fields
    : Object.keys(fields || {}).filter((key) => fields[key]);

  if (!fieldList.length) {
    fieldList = [
      "fullName",
      "jobTitle",
      "company",
      "phones",
      "emails",
      "website", // Keep as 'website' for CSV header display
      "address",
    ];
  }

  const header = fieldList.join(",");

  const rows = contacts.map((contact) =>
    fieldList
      .map((field) => {
        // CRITICAL FIX: Map 'website' field to 'websites' data
        let value = field === 'website' ? contact['websites'] : contact[field];

        if (Array.isArray(value)) {
          value = value.join(";");
        }

        if (field === "phones" && value) {
          value = value
            .split(";")
            .map((p) => `'${p}'`)
            .join(";");
        }

        value = String(value || "").replace(/"/g, '""');
        return `"${value}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

// Generate QR code for VCF, return as base64 string
async function generateVCFQR(contact) {
  const vcf = generateVCF(contact);
  try {
    return await QRCode.toDataURL(vcf, { 
      type: "image/png",
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error("QR generation failed:", err);
    throw err;
  }
}

module.exports = {
  generateVCF,
  generateBulkVCF,
  generateCSV,
  generateVCFQR,
};
