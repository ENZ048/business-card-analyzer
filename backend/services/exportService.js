const QRCode = require("qrcode");
const XLSX = require("xlsx-style");

// Normalize array-like fields
function normalizeArrayField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return [field];
}

// Deduplicate websites array
function deduplicateWebsites(websites) {
  if (!websites || !Array.isArray(websites)) return [];
  
  const seen = new Set();
  const unique = [];
  
  websites.forEach(website => {
    if (website && typeof website === 'string') {
      const clean = website.trim().toLowerCase();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        unique.push(website.trim());
      }
    }
  });
  
  return unique;
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

  // Use deduplicated websites
  const uniqueWebsites = deduplicateWebsites(websites);
  uniqueWebsites.forEach((w) => {
    vcf += `URL:${w}\n`;
  });

  if (address) vcf += `ADR;TYPE=WORK:;;${address}\n`;
  vcf += `END:VCARD\n`;

  // DEBUG: Log single VCF generation
  console.log("🔍 VCF Debug - Generated VCF for:", fullName || "Unknown");
  console.log("🔍 VCF Debug - VCF content:", vcf);

  return vcf;
}

// Generate bulk VCF (all contacts concatenated)
function generateBulkVCF(contacts) {
  console.log("🔍 Bulk VCF Debug - Starting bulk VCF generation for", contacts.length, "contacts");
  
  const vcfStrings = contacts.map((c, index) => {
    const vcf = generateVCF(c);
    console.log(`🔍 Bulk VCF Debug - Contact ${index + 1}:`, c.fullName || "Unknown");
    return vcf;
  });
  
  const bulkVCF = vcfStrings.join("\n");
  console.log("🔍 Bulk VCF Debug - Final bulk VCF length:", bulkVCF.length);
  console.log("🔍 Bulk VCF Debug - Number of VCF entries:", vcfStrings.length);
  
  return bulkVCF;
}

// Generate CSV string with improved styling and formatting
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
      "websites", // Fixed: Use 'websites' (plural) to match actual data field
      "address",
    ];
  }

  // Enhanced header mapping with better display names
  const headerMap = {
    fullName: "Full Name",
    jobTitle: "Job Title",
    company: "Company",
    phones: "Phone Numbers",
    emails: "Email Addresses",
    websites: "Websites", // Fixed: Use 'websites' (plural) to match actual data field
    address: "Address"
  };

  // DEBUG: Log field processing
  console.log("🔍 CSV Debug - Fields parameter:", fields);
  console.log("🔍 CSV Debug - Field list:", fieldList);
  console.log("🔍 CSV Debug - Header map keys:", Object.keys(headerMap));

  // Create styled headers
  const headers = fieldList.map(field => headerMap[field] || field);
  const header = headers.join(",");

  const rows = contacts.map((contact) =>
    fieldList
      .map((field) => {
        // Get value directly since field names are now consistent
        let value = contact[field];

        if (Array.isArray(value)) {
          value = value.join(";");
        }

        if (field === "phones" && value) {
          value = value
            .split(";")
            .map((p) => p.trim())  // Just trim whitespace, no quotes
            .join(", ");  // Use comma + space instead of semicolon
        }

        if (field === "websites" && value) {
          // Deduplicate websites for CSV
          const websitesArray = Array.isArray(value) ? value : value.split(";");
          const uniqueWebsites = deduplicateWebsites(websitesArray);
          value = uniqueWebsites.join(", ");
        }

        // Add placeholders for empty fields
        if (!value || value === "") {
          switch (field) {
            case "fullName":
              value = "Not Provided";
              break;
            case "jobTitle":
              value = "Not Specified";
              break;
            case "company":
              value = "Not Specified";
              break;
            case "phones":
              value = "No Phone Numbers";
              break;
            case "emails":
              value = "No Email Addresses";
              break;
            case "websites":
              value = "No Websites";
              break;
            case "address":
              value = "No Address";
              break;
            default:
              value = "Not Available";
          }
        }

        value = String(value || "").replace(/"/g, '""');
        return `"${value}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

// Generate XLSX file with enhanced styling and formatting
function generateXLSX(contacts, fields) {
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
      "websites",
      "address",
    ];
  }

  // Enhanced header mapping with better display names
  const headerMap = {
    fullName: "Full Name",
    jobTitle: "Job Title",
    company: "Company",
    phones: "Phone Numbers",
    emails: "Email Addresses",
    websites: "Websites",
    address: "Address"
  };

  // Create styled headers
  const headers = fieldList.map(field => headerMap[field] || field);

  // Create workbook and worksheet
  const workbook = {};
  const worksheet = {};
  
  // Add headers to worksheet
  headers.forEach((header, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    worksheet[cellAddress] = {
      v: header,
      s: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    };
  });

  // Add contact data rows
  contacts.forEach((contact, rowIndex) => {
    fieldList.forEach((field, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      let value = field === 'websites' ? contact['websites'] : contact[field];

      // Enhanced data formatting based on field type
      switch (field) {
                  case "phones":
            if (Array.isArray(value) && value.length > 0) {
              value = value
                .map(phone => phone.trim())
                .join(", ");
            } else {
              value = "No Phone Numbers";
            }
            break;

          case "emails":
            if (Array.isArray(value) && value.length > 0) {
              value = value
                .map(email => email.trim().toLowerCase())
                .filter(email => email.includes('@'))
                .join(", ");
            } else {
              value = "No Email Addresses";
            }
            break;

          case "websites":
            if (Array.isArray(value) && value.length > 0) {
              // Deduplicate websites for XLSX
              const uniqueWebsites = deduplicateWebsites(value);
              value = uniqueWebsites
                .map(website => {
                  let clean = website.trim();
                  if (!clean.startsWith('http')) {
                    clean = 'https://' + clean;
                  }
                  return clean;
                })
                .filter(website => website.length > 0)
                .join(", ");
            } else {
              value = "No Websites";
            }
            break;

                  case "fullName":
            if (value && typeof value === 'string') {
              value = value
                .split(' ')
                .map(word => {
                  if (word.length <= 2) return word.toUpperCase();
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join(' ');
            } else {
              value = "Not Provided";
            }
            break;

          case "jobTitle":
            if (value && typeof value === 'string') {
              value = value
                .split(' ')
                .map(word => {
                  if (word.length <= 2) return word.toUpperCase();
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join(' ');
            } else {
              value = "Not Specified";
            }
            break;

        case "company":
          if (value && typeof value === 'string') {
            const abbreviations = ['Ltd', 'LLC', 'Inc', 'Corp', 'Pvt', 'LLP', 'Co'];
            value = value
              .split(' ')
              .map(word => {
                const cleanWord = word.replace(/[.,]/g, '');
                if (abbreviations.includes(cleanWord)) return cleanWord;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              })
              .join(' ');
          } else {
            value = "Not Specified";
          }
          break;

        case "address":
          if (value && typeof value === 'string') {
            value = value
              .replace(/\s+/g, ' ')
              .replace(/,\s*,/g, ',')
              .replace(/^\s*,\s*/, '')
              .replace(/\s*,\s*$/, '')
              .trim();
          } else {
            value = "No Address";
          }
          break;

                  default:
            if (Array.isArray(value)) {
              value = value.join(", ");
            } else if (!value || value === "") {
              value = "Not Available";
            }
            break;
      }

      // Add cell with styling
      const isEvenRow = (rowIndex + 1) % 2 === 0;
      const backgroundColor = isEvenRow ? "F8F9FA" : "FFFFFF";
      
      worksheet[cellAddress] = {
        v: value || "",
        s: {
          fill: { fgColor: { rgb: backgroundColor } },
          alignment: { vertical: "center", horizontal: "left" }
        }
      };
    });
  });

  // Set worksheet properties
  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: contacts.length, c: fieldList.length - 1 }
  });

  // Set column widths
  worksheet['!cols'] = fieldList.map(field => {
    const header = headerMap[field] || field;
    const maxLength = Math.max(
      header.length,
      ...contacts.map(contact => {
        const value = field === 'websites' ? contact['websites'] : contact[field];
        if (Array.isArray(value)) {
          return value.join(", ").length;
        }
        return String(value || "").length;
      })
    );
    return { wch: Math.min(Math.max(maxLength + 3, 15), 60) };
  });

  // Add worksheet to workbook
  workbook.Sheets = { "Business Cards": worksheet };
  workbook.SheetNames = ["Business Cards"];

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

// Generate QR code for VCF, return as base64 string
async function generateVCFQR({ vcfContent, filename = "contact.vcf" }) {
  try {
    return await QRCode.toDataURL(vcfContent, { 
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
  generateXLSX,
};
