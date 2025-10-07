// controllers/ocrController.js
const vision = require("@google-cloud/vision");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { pairCards, mergeCards } = require("../services/cardPairingService");
const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Usage = require("../models/Usage");
const DemoSession = require("../models/DemoSession");
const ScanActivity = require("../models/ScanActivity");
const llmLogger = require("../utils/llmLogger");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const visionClient = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
});

// ---------- Constants ----------
const GENERIC_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediff.com"];
const GENERIC_COMPANY_DOMAINS = [...GENERIC_DOMAINS, "google.com", "microsoft.com", "apple.com"];
const BLOCKED_COMPANIES = ["Google", "Microsoft", "Apple", "Yahoo", "Gmail"];
const JUNK_WORDS = ["our products", "since", "group", "company", "manding", "trading", "services", "solutions"];

// Extended exclude words for better name validation
const NAME_EXCLUDE_WORDS = [
  'Private Limited', 'Pvt Ltd', 'Company', 'Corporation', 'Services', 'Solutions',
  'Technologies', 'Enterprises', 'Industries', 'Group', 'International',
  'Office', 'Phone', 'Email', 'Website', 'Address', 'Contact', 'Mobile',
  'Telephone', 'Fax', 'Director', 'Manager', 'CEO', 'CTO', 'Founder'
];

const BULK_OCR_BATCH_SIZE = 3; // Reduced to prevent Google API quota exhaustion

// ---------- Helpers ----------

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// Demo helpers
const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL || 'bd@troikatech.net').toLowerCase();
const isDemoUser = (user) => !!(user && (user.isDemo || (user.email && user.email.toLowerCase() === DEMO_USER_EMAIL)));

// ---------- Built-in Card Merging Function ----------
function mergeParsedCards(cards) {
  if (!cards || cards.length === 0) return [];
  
  const merged = [];
  const processed = new Set();
  
  for (let i = 0; i < cards.length; i++) {
    if (processed.has(i)) continue;
    
    const currentCard = cards[i];
    const duplicates = [];
    
    // Find potential duplicates
    for (let j = i + 1; j < cards.length; j++) {
      if (processed.has(j)) continue;
      
      const otherCard = cards[j];
      if (areCardsDuplicate(currentCard, otherCard)) {
        duplicates.push(j);
      }
    }
    
    // Merge if duplicates found
    if (duplicates.length > 0) {
      const cardsToMerge = [currentCard, ...duplicates.map(idx => cards[idx])];
      const mergedCard = mergeMultipleCards(cardsToMerge);
      merged.push(mergedCard);
      
      // Mark as processed
      processed.add(i);
      duplicates.forEach(idx => processed.add(idx));
    } else {
      merged.push(currentCard);
      processed.add(i);
    }
  }
  
  return merged;
}

function areCardsDuplicate(card1, card2) {
  // Check for duplicate based on multiple criteria
  const nameMatch = card1.fullName && card2.fullName && 
    normalizeForComparison(card1.fullName) === normalizeForComparison(card2.fullName);
    
  const emailMatch = card1.emails?.length > 0 && card2.emails?.length > 0 &&
    card1.emails.some(e1 => card2.emails.some(e2 => e1.toLowerCase() === e2.toLowerCase()));
    
  const phoneMatch = card1.phones?.length > 0 && card2.phones?.length > 0 &&
    card1.phones.some(p1 => card2.phones.some(p2 => 
      normalizePhone(p1) === normalizePhone(p2)
    ));
    
  const companyMatch = card1.company && card2.company &&
    normalizeForComparison(card1.company) === normalizeForComparison(card2.company);
  
  // Consider duplicate if name matches and (email or phone matches), or if email and phone both match
  return (nameMatch && (emailMatch || phoneMatch)) || 
         (emailMatch && phoneMatch) ||
         (nameMatch && companyMatch && (emailMatch || phoneMatch));
}

function normalizeForComparison(str) {
  return str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
}

function normalizePhone(phone) {
  return phone?.replace(/\D/g, '').slice(-10) || ''; // Last 10 digits
}

function mergeMultipleCards(cards) {
  const merged = {
    cardId: cards[0].cardId || uuidv4(),
    fullName: "",
    jobTitle: "",
    company: "",
    phones: [],
    emails: [],
    websites: [],
    address: "",
    gptSource: "merged",
    confidence: 0,
  };
  
  // Merge all fields, preferring non-empty values
  cards.forEach(card => {
    if (!merged.fullName && card.fullName && card.fullName !== "N/A") {
      merged.fullName = card.fullName;
    }
    if (!merged.jobTitle && card.jobTitle) {
      merged.jobTitle = card.jobTitle;
    }
    if (!merged.company && card.company && card.company !== "N/A") {
      merged.company = card.company;
    }
    if (!merged.address && card.address) {
      merged.address = card.address;
    }
    
    // Merge arrays, removing duplicates
    if (card.phones) {
      merged.phones = [...new Set([...merged.phones, ...ensureArray(card.phones)])];
    }
    if (card.emails) {
      merged.emails = [...new Set([...merged.emails, ...ensureArray(card.emails)])];
    }
    if (card.websites) {
      merged.websites = [...new Set([...merged.websites, ...ensureArray(card.websites)])];
    }
  });
  
  // Calculate average confidence
  const validConfidences = cards.filter(c => c.confidence > 0).map(c => c.confidence);
  merged.confidence = validConfidences.length > 0 
    ? Math.round(validConfidences.reduce((sum, conf) => sum + conf, 0) / validConfidences.length)
    : 0;
  
  return merged;
}

// ---------- Enhanced Extraction Functions ----------
function extractEmails(text) {
  // More comprehensive email regex
  const emailRegex = /\b[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  
  return [...new Set(emails.filter(email => {
    // Filter out obviously wrong emails
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && 
           domain.includes('.') && 
           !domain.startsWith('.') && 
           !domain.endsWith('.') &&
           domain.length > 3 &&
           !domain.includes('..'); // No consecutive dots
  }))];
}

function extractPhones(text) {
  // Enhanced phone number patterns
  const phonePatterns = [
    /\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
    /\d{4}[-.\s]?\d{3}[-.\s]?\d{3}/g, // Some international formats
    /\d{2,4}[-.\s]?\d{4}[-.\s]?\d{4}/g, // General format
    /\d{10,}/g // Just digits, 10 or more
  ];
  
  const phones = [];
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    phones.push(...matches);
  });
  
  return [...new Set(phones.filter(phone => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15; // Valid phone length
  }))];
}

function expandPhoneVariants(phones) {
  phones = ensureArray(phones);
  const expanded = [];
  
  phones.forEach((p) => {
    if (typeof p !== "string") return;
    
    // Handle slash notation (e.g., "123-456-78/90")
    if (p.includes("/")) {
      const baseMatch = p.match(/(\d+[-.\s]*\d*[-.\s]*\d*)/);
      if (baseMatch) {
        const basePart = baseMatch[1];
        const lastDigits = basePart.match(/\d{2}$/);
        if (lastDigits) {
          const baseWithoutLast2 = basePart.slice(0, -2);
          const suffixes = p.split("/").map(s => s.replace(/\D/g, '')).filter(Boolean);
          suffixes.forEach(suffix => {
            if (suffix.length <= 2) {
              expanded.push(baseWithoutLast2 + suffix);
            } else {
              expanded.push(suffix);
            }
          });
        }
      }
    } else {
      // Clean and validate single phone numbers
      const cleaned = p.replace(/[^\d+]/g, '');
      if (cleaned.match(/^\+?\d{7,15}$/)) {
        expanded.push(cleaned);
      }
    }
  });
  
  return [...new Set(expanded.filter(Boolean))];
}

// ---------- Enhanced Website Extraction ----------
function normalizeWebsite(url) {
  if (!url) return "";
  
  let clean = url.trim().toLowerCase();
  
  // Remove multiple protocols
  clean = clean.replace(/^(https?:\/\/)+/gi, "");
  
  // Remove www
  clean = clean.replace(/^www\./, "");
  
  // Remove trailing slashes and extra characters
  clean = clean.replace(/[\/\s\n\r\t]*$/, "");
  
  // Validate basic domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(clean)) {
    return "";
  }
  
  // Add https protocol
  return "https://" + clean;
}

function extractWebsites(text) {
  const websitePatterns = [
    // Standard URLs with protocol
    /https?:\/\/(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(?:[a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})(?:\/[^\s]*)*/gi,
    
    // URLs without protocol but with www
    /www\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(?:com|org|net|edu|gov|mil|int|co\.uk|co\.in|in|co|biz|info|ai|io|ly|me|us|ca|de|fr|it|jp|kr|cn)(?:\/[^\s]*)*/gi,
    
    // Domain names without www (more comprehensive TLD list)
    /\b[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(?:com|org|net|edu|gov|mil|int|co\.uk|co\.in|in|co|biz|info|ai|io|ly|me|us|ca|de|fr|it|jp|kr|cn|app|tech|online|site|store|shop|blog|news|pro|club|agency|solutions|services|consulting|group|company|corp|ltd|inc)\b/gi,
    
    // Common patterns found on business cards
    /(?:website|web|url|site)[:\s]*([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/gi,
    
    // Email domain extraction (sometimes companies use their website domain in email)
    /(?:@)([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/gi
  ];
  
  const websites = [];
  
  websitePatterns.forEach((pattern, index) => {
    const matches = text.match(pattern) || [];
    
    matches.forEach(match => {
      let website = match;
      
      // For email domain pattern, extract just the domain
      if (index === 4) { // Email domain pattern
        const domainMatch = match.match(/@([^@\s]+)/);
        if (domainMatch) {
          website = domainMatch[1];
        }
      }
      
      // For website: prefix pattern, extract just the URL
      if (index === 3) { // Website prefix pattern
        const urlMatch = match.match(/(?:website|web|url|site)[:\s]*([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/i);
        if (urlMatch) {
          website = urlMatch[1];
        }
      }
      
      websites.push(website);
    });
  });
  
  // Clean and filter websites
  return [...new Set(websites
    .map(w => w.trim().toLowerCase())
    .filter(w => {
      // Skip generic domains
      if (GENERIC_DOMAINS.some(g => w.includes(g))) return false;
      
      // Skip if it's clearly not a website
      if (w.length < 4) return false;
      
      // Must contain a dot
      if (!w.includes('.')) return false;
      
      // Skip if it contains spaces (likely not a website)
      if (w.includes(' ')) return false;
      
      return true;
    })
    .map(normalizeWebsite)
    .filter(w => {
      if (!w) return false;
      try {
        new URL(w);
        return true;
      } catch {
        // If URL constructor fails, try adding common protocols
        try {
          new URL('https://' + w.replace(/^https?:\/\//, ''));
          return true;
        } catch {
          return false;
        }
      }
    })
  )];
}

// ---------- Enhanced Name Extraction ----------
function isValidName(name) {
  if (!name || name.length < 2) return false;
  
  // Exclude company-like words and common false positives
  const lowerName = name.toLowerCase();
  
  // Check against exclude words
  if (NAME_EXCLUDE_WORDS.some(word => lowerName.includes(word.toLowerCase()))) {
    return false;
  }
  
  // Exclude if contains 3+ consecutive digits
  if (/\d{3,}/.test(name)) return false;
  
  // Exclude if contains @ or common symbols
  if (/@|#|\$|%|\*/.test(name)) return false;
  
  // Must contain at least one alphabetic character
  if (!/[a-zA-Z]/.test(name)) return false;
  
  // Exclude single character names
  if (name.trim().length < 2) return false;
  
  return true;
}

function extractNameFromText(text) {
  if (!text) return "";
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // First, try to find names with proper titles/roles
  const titlePattern = /(?:Director|Founder|Manager|CEO|CTO|Co[- ]?Founder|Partner|Proprietor|President|VP|Vice President|Executive|Head|Lead)[:\-\s]+([A-Z][a-zA-Z.\s]{2,30})/i;
  const titleMatch = text.match(titlePattern);
  if (titleMatch) {
    const name = titleMatch[1].trim();
    if (isValidName(name)) return cleanName(name);
  }
  
  // Look for names at the beginning of the card (typically first 3 lines)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    
    // Enhanced pattern: supports initials, middle names, and common name patterns
    const namePatterns = [
      /^[A-Z][a-z]{1,}(\s+[A-Z]\.?\s*)*[A-Z][a-z]{1,}$/,  // First Last, First M. Last
      /^[A-Z][a-z]{1,}\s+[A-Z][a-z]{1,}$/,                // Simple First Last
      /^[A-Z]\.\s*[A-Z][a-z]{1,}\s+[A-Z][a-z]{1,}$/,       // F. Middle Last
      /^[A-Z][a-z]{1,}\s+[A-Z]\.\s*[A-Z][a-z]{1,}$/        // First M. Last
    ];
    
    if (namePatterns.some(pattern => pattern.test(line)) && isValidName(line)) {
      return cleanName(line);
    }
  }
  
  // Look for capitalized words that could be names
  const namePatterns = text.match(/\b[A-Z][a-z]{1,}(?:\s+[A-Z]\.?\s*)*[A-Z][a-z]{1,}\b/g) || [];
  for (const pattern of namePatterns) {
    if (isValidName(pattern)) return cleanName(pattern);
  }
  
  return "";
}

function cleanName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

// ---------- Enhanced Company Processing ----------
function deriveCompanyFromDomain(domain) {
  if (!domain) return "";
  
  const clean = domain.replace(/^www\./, "").toLowerCase();
  if (GENERIC_COMPANY_DOMAINS.includes(clean)) return "";
  
  const name = clean.split(".")[0];
  // Capitalize first letter of each word
  return name.split(/[-_]/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function preferBrandName(name) {
  if (!name) return "";
  
  const words = name.split(/\s+/);
  const legalTerms = /(pvt|private|ltd|llp|inc|llc|corp|company|enterprises|corporation)/i;
  const hasLegal = legalTerms.test(name);
  
  if (hasLegal && words.length > 2) {
    // Remove legal terms but keep meaningful words
    return words.filter(w => !legalTerms.test(w)).join(" ").trim();
  }
  
  return name;
}

function sanitizeCompany(name, websites, emails, logos) {
  // Try provided name first
  if (name && !BLOCKED_COMPANIES.includes(name.trim())) {
    return preferBrandName(name);
  }
  
  // Try logos
  if (logos && logos.length > 0) {
    const logo = logos[0];
    if (!BLOCKED_COMPANIES.includes(logo)) {
      return preferBrandName(logo);
    }
  }
  
  // Derive from email domain
  const emailDomain = emails?.[0]?.split("@")[1];
  if (emailDomain) {
    const derived = deriveCompanyFromDomain(emailDomain);
    if (derived) return derived;
  }
  
  // Derive from website
  const websiteDomain = websites?.[0]?.replace(/^https?:\/\//, "").split("/")[0];
  if (websiteDomain) {
    return deriveCompanyFromDomain(websiteDomain);
  }
  
  return "";
}

// ---------- Enhanced Address Processing ----------
function fallbackAddressFromText(text) {
  if (!text) return "";
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Look for address indicators
  const addressIndicators = [
    /address/i, /addr/i, /location/i, /office/i,
    /road|street|avenue|lane|drive|place|boulevard|rd|st|ave/i,
    /area|sector|block|phase|tower|building|floor|apartment|apt/i,
    /city|town|district|state|country/i,
    /\d{5,6}/, // PIN codes
    /plot|house|flat/i
  ];
  
  const addressLines = [];
  
  lines.forEach(line => {
    // Skip lines with emails, phones, or websites
    if (/@/.test(line) || /https?:\/\//.test(line) || /www\./i.test(line)) return;
    if (/\+?\d[\d\s\-()]{7,}\d/.test(line)) return;
    
    // Include lines with address indicators or lines with numbers (could be addresses)
    if (addressIndicators.some(indicator => indicator.test(line)) || 
        (/\d/.test(line) && line.length > 5 && !/^\d+$/.test(line))) {
      addressLines.push(line);
    }
  });
  
  return addressLines.join(', ');
}

function cleanAddress(text) {
  if (!text) return "";
  
  const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(line =>
    line &&
    !/^\d{7,}$/.test(line) &&   // Just phone numbers
    !/@/.test(line) &&          // emails
    !/^https?:\/\//.test(line) && // websites
    !/^www\./i.test(line) &&    // websites
    line.length > 2
  );
  
  return lines.join(', ');
}

// ---------- Image Compression ----------
async function compressImage(filePath) {
  const tempPath = filePath + '.compressed.jpg';

  try {
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const fileSizeInMB = fs.statSync(filePath).size / (1024 * 1024);

    // If image is already small enough (< 4MB) and reasonably sized, skip compression
    if (fileSizeInMB < 4 && metadata.width <= 2000 && metadata.height <= 2000) {
      return filePath;
    }

    // Compress image to reduce bandwidth
    await sharp(filePath)
      .resize(2000, 2000, { // Max 2000x2000 pixels (good enough for OCR)
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // 85% quality JPEG
      .toFile(tempPath);

    // Replace original with compressed
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);

    const newSize = fs.statSync(filePath).size / (1024 * 1024);
    console.log(`Image compressed: ${fileSizeInMB.toFixed(2)}MB → ${newSize.toFixed(2)}MB`);

    return filePath;
  } catch (error) {
    console.error("Image compression error:", error);
    // If compression fails, clean up and use original
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    return filePath;
  }
}

// ---------- Retry Logic with Exponential Backoff ----------
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryableError = error.code === 8 || error.code === 13 || error.code === 14 || error.code === 4;

      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ---------- Enhanced OCR Processing ----------
function preprocessText(text) {
  if (!text) return "";

  // Fix common OCR errors
  let cleaned = text
    .replace(/[|]/g, 'I') // Common OCR mistake - pipe to I
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-ASCII characters except newlines
    .trim();

  return cleaned;
}

async function processOCR(filePath) {

  try {
    // Compress image before sending to Google Vision
    const compressedPath = await compressImage(filePath);

    // Use retry logic for Vision API calls
    const [textResult] = await retryWithBackoff(() =>
      visionClient.textDetection(compressedPath)
    );

    const [documentResult] = await retryWithBackoff(() =>
      visionClient.documentTextDetection(compressedPath)
    );

    let text = "";
    if (documentResult.fullTextAnnotation?.text) {
      // Use document text detection for structured text
      text = documentResult.fullTextAnnotation.text;
    } else if (textResult.textAnnotations?.length > 0) {
      // Fallback to regular text detection
      text = textResult.textAnnotations[0].description;
    }

    const [logoResult] = await retryWithBackoff(() =>
      visionClient.logoDetection(compressedPath)
    );
    const logos = logoResult.logoAnnotations?.map(l => l.description) || [];

    // Clean and preprocess the text
    const cleanedText = preprocessText(text);

    return {
      filename: path.basename(filePath),
      text: cleanedText,
      originalText: text,
      logos,
      emails: extractEmails(cleanedText),
      phones: extractPhones(cleanedText),
      websites: extractWebsites(cleanedText),
    };

  } catch (error) {
    console.error("OCR processing error:", error);
    throw error;
  }
}

// ---------- Enhanced Batch Processing with Delay ----------
async function processInBatches(items, batchSize, fn) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);

      // Add delay between batches to prevent API rate limiting
      if (i + batchSize < items.length) {
        console.log(`Processed ${i + batch.length}/${items.length} items. Waiting 2s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`Batch processing error at ${i}:`, error);
      // Process individually on batch failure with delay
      for (const item of batch) {
        try {
          const result = await fn(item);
          results.push(result);
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between individual items
        } catch (itemError) {
          console.error("Individual item processing failed:", itemError);
        }
      }
    }
  }

  return results;
}

// ---------- Enhanced GPT Parsing with Better Website Extraction ----------
async function parseCardsWithGPT(cards, batchSize = 5) {
  const startTime = Date.now();
  
  // Log the overall parsing request
  llmLogger.logRequest('ocrController', 'parseCardsWithGPT', {
    totalCards: cards.length,
    batchSize,
    cardsSummary: cards.map(card => ({
      textLength: card.text?.length || 0,
      hasEmails: (card.emails || []).length > 0,
      hasPhones: (card.phones || []).length > 0,
      hasWebsites: (card.websites || []).length > 0,
      hasLogos: (card.logos || []).length > 0
    }))
  });
  
  const batches = [];
  for (let i = 0; i < cards.length; i += batchSize) {
    batches.push(cards.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch, batchIndex) => {
      const batchStartTime = Date.now();
      const offset = batchIndex * batchSize;
      
      const prompt = `You are an expert at parsing business card OCR text into structured JSON.
Extract only relevant contact information with high accuracy.

IMPORTANT: Pay special attention to extracting websites/URLs. Look for:
- Standard URLs (http://example.com, https://example.com)
- Domain names without protocol (example.com, company.co.in)
- Domains mentioned after "website:", "web:", "www.", or similar
- Company domains that might be embedded in the text
- Domains from email addresses (if @company.com, then website could be company.com)

Rules:
1. Extract exactly ${batch.length} card objects in the "cards" array
2. Person's full name (not company name) 
3. Job title/designation only
4. Company name (prefer brand name over legal entity)
5. Clean phone numbers (remove extra formatting)
6. Valid email addresses only
7. **Company websites - be thorough in finding any domain names or URLs**
8. Complete address if clearly present
9. If information is unclear or missing, leave empty string rather than guessing
10. Ignore promotional text, slogans, services descriptions

${batch.map((card, idx) => `
Card ${offset + idx + 1}:
OCR Text: ${card.text}
Pre-detected: 
- Emails: ${card.emails?.join(', ') || 'None'}
- Phones: ${card.phones?.join(', ') || 'None'}  
- Pre-detected Websites: ${card.websites?.join(', ') || 'None'}
- Logos: ${card.logos?.join(', ') || 'None'}

LOOK CAREFULLY for any website/domain mentions in the OCR text above.
`).join('')}

Return valid JSON only:`;

      const requestData = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "business_cards",
            schema: {
              type: "object",
              properties: {
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      fullName: { type: "string" },
                      jobTitle: { type: "string" },
                      company: { type: "string" },
                      phones: { type: "array", items: { type: "string" } },
                      emails: { type: "array", items: { type: "string" } },
                      websites: { type: "array", items: { type: "string" } },
                      address: { type: "string" },
                    },
                    required: ["fullName","jobTitle","company","phones","emails","websites","address"],
                  },
                },
              },
              required: ["cards"],
            },
          },
        },
        batchInfo: {
          batchIndex,
          offset,
          batchSize: batch.length,
          cardsInBatch: batch.map(card => ({
            textLength: card.text?.length || 0,
            preDetected: {
              emails: card.emails || [],
              phones: card.phones || [],
              websites: card.websites || [],
              logos: card.logos || []
            }
          }))
        }
      };

      // Log the batch request
      llmLogger.logRequest('ocrController', `parseCardsWithGPT_batch_${batchIndex}`, requestData);

      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1, // Lower temperature for consistency
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "business_cards",
              schema: {
                type: "object",
                properties: {
                  cards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fullName: { type: "string" },
                        jobTitle: { type: "string" },
                        company: { type: "string" },
                        phones: { type: "array", items: { type: "string" } },
                        emails: { type: "array", items: { type: "string" } },
                        websites: { type: "array", items: { type: "string" } },
                        address: { type: "string" },
                      },
                      required: ["fullName","jobTitle","company","phones","emails","websites","address"],
                    },
                  },
                },
                required: ["cards"],
              },
            },
          },
        });

        const batchProcessingTime = Date.now() - batchStartTime;
        const parsed = JSON.parse(response.choices[0].message.content);
        const gptCards = parsed.cards;
        
        // Log the batch response
        llmLogger.logResponse('ocrController', `parseCardsWithGPT_batch_${batchIndex}`, {
          rawResponse: response,
          parsedData: parsed,
          gptCardsCount: gptCards.length,
          expectedCount: batch.length,
          usage: response.usage
        }, batchProcessingTime);
        
        if (gptCards.length !== batch.length) {
          console.warn(`GPT returned ${gptCards.length} cards but expected ${batch.length} in batch ${batchIndex}`);
        }

        return gptCards.map((r, i) => normalizeCard(r, batch[i], offset + i + 1));
        
      } catch (err) {
        const batchProcessingTime = Date.now() - batchStartTime;
        console.error(`GPT Error in batch ${batchIndex}:`, err.message);
        
        // Log the error
        llmLogger.logError('ocrController', `parseCardsWithGPT_batch_${batchIndex}`, err, requestData);
        
        // Retry once with simpler prompt
        try {
          const simplePrompt = `Parse these business cards into JSON format. Extract: fullName, jobTitle, company, phones (array), emails (array), websites (array), address. Be thorough with website extraction.

${batch.map((card, idx) => `Card ${idx + 1}: ${card.text}`).join('\n\n')}`;

          const retryRequestData = {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: simplePrompt }],
            temperature: 0.2,
            isRetry: true,
            batchInfo: requestData.batchInfo
          };

          // Log the retry request
          llmLogger.logRequest('ocrController', `parseCardsWithGPT_batch_${batchIndex}_retry`, retryRequestData);

          const retryResponse = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: simplePrompt }],
            temperature: 0.2,
          });
          
          const retryProcessingTime = Date.now() - batchStartTime;
          const retryParsed = JSON.parse(retryResponse.choices[0].message.content);
          const retryCards = retryParsed.cards || [retryParsed];
          
          // Log the retry response
          llmLogger.logResponse('ocrController', `parseCardsWithGPT_batch_${batchIndex}_retry`, {
            rawResponse: retryResponse,
            parsedData: retryParsed,
            retryCardsCount: retryCards.length,
            usage: retryResponse.usage
          }, retryProcessingTime);
          
          return retryCards.map((r, i) => normalizeCard(r, batch[i], offset + i + 1));
        } catch (retryErr) {
          const retryProcessingTime = Date.now() - batchStartTime;
          console.error("GPT retry failed:", retryErr);
          
          // Log the retry error
          llmLogger.logError('ocrController', `parseCardsWithGPT_batch_${batchIndex}_retry`, retryErr, requestData);
          
          return batch.map((c, i) => fallbackParse(c, offset + i + 1));
        }
      }
    })
  );

  const totalProcessingTime = Date.now() - startTime;
  const flatResults = results.flat();
  const mergedResults = mergeParsedCards(flatResults);

  // Log the overall parsing response
  llmLogger.logResponse('ocrController', 'parseCardsWithGPT', {
    totalCardsProcessed: cards.length,
    totalBatches: batches.length,
    finalResultsCount: mergedResults.length,
    processingSummary: {
      totalTime: totalProcessingTime,
      averageTimePerCard: Math.round(totalProcessingTime / cards.length),
      averageTimePerBatch: Math.round(totalProcessingTime / batches.length)
    }
  }, totalProcessingTime);

  return mergedResults;
}

// ---------- Enhanced Normalization ----------
function normalizeCard(r, fallback, index) {
  // Enhanced name processing
  let fullName = r.fullName || extractNameFromText(fallback.text);
  if (JUNK_WORDS.some(w => fullName?.toLowerCase().includes(w))) {
    fullName = extractNameFromText(fallback.text) || "N/A";
  }

  // Enhanced company processing
  let company = sanitizeCompany(
    r.company, 
    ensureArray(r.websites || fallback.websites), 
    ensureArray(r.emails || fallback.emails), 
    fallback.logos
  );

  // Enhanced job title extraction
  let jobTitle = r.jobTitle;
  if (!jobTitle) {
    const titleMatch = fallback.text.match(/(Director|Founder|Manager|CEO|CTO|Co[- ]?Founder|Partner|Proprietor|President|VP|Vice President|Executive)/i);
    jobTitle = titleMatch ? titleMatch[0] : "";
  }

  // Merge websites from both GPT and pre-detection
  const allWebsites = [
    ...ensureArray(r.websites || []),
    ...ensureArray(fallback.websites || [])
  ];
  const uniqueWebsites = [...new Set(allWebsites)]
    .map(normalizeWebsite)
    .filter(Boolean);

  return {
    cardId: uuidv4(),
    fullName: cleanName(fullName),
    jobTitle,
    company,
    phones: expandPhoneVariants(ensureArray(r.phones?.length ? r.phones : fallback.phones)),
    emails: ensureArray(r.emails?.length ? r.emails : fallback.emails),
    websites: uniqueWebsites,
    address: cleanAddress(r.address || fallbackAddressFromText(fallback.text)),
    gptSource: "gpt-schema",
    confidence: 0, // Will be calculated later
  };
}

function fallbackParse(c, index) {
  const name = extractNameFromText(c.text);
  const company = sanitizeCompany("", c.websites, c.emails, c.logos);
  
  return {
    cardId: uuidv4(),
    fullName: name,
    jobTitle: c.text.match(/(Director|Founder|Manager|CEO|CTO|Co[- ]?Founder|Partner|Proprietor)/i)?.[0] || "",
    company,
    phones: expandPhoneVariants(ensureArray(c.phones)),
    emails: ensureArray(c.emails),
    websites: ensureArray(c.websites).map(normalizeWebsite).filter(Boolean),
    address: cleanAddress(fallbackAddressFromText(c.text)),
    gptSource: "fallback",
    confidence: 0,
  };
}

// ---------- Validation and Confidence Scoring ----------
function validateAndScoreCard(card) {
  let confidence = 0;
  
  const factors = {
    hasValidName: (card.fullName && card.fullName !== "N/A" && card.fullName.length > 2) ? 25 : 0,
    hasCompany: (card.company && card.company !== "N/A" && card.company.length > 1) ? 20 : 0,
    hasValidEmail: (card.emails?.length > 0 && card.emails.some(e => e.includes('@'))) ? 20 : 0,
    hasValidPhone: (card.phones?.length > 0 && card.phones.some(p => p.replace(/\D/g, '').length >= 7)) ? 15 : 0,
    hasWebsite: (card.websites?.length > 0 && card.websites.some(w => w.startsWith('http'))) ? 10 : 0,
    hasAddress: (card.address && card.address.length > 10) ? 10 : 0
  };
  
  confidence = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  return {
    ...card,
    confidence,
    isValid: confidence >= 40, // Minimum threshold for valid card
    validationFactors: factors
  };
}

// ---------- Record Scan Activity Function ----------
async function recordScanActivity(userId, sessionId, scanCount, scanType, filesProcessed, sessionScansRemaining, req) {
  try {
    const scanActivity = new ScanActivity({
      userId,
      sessionId,
      scanCount,
      scanType,
      filesProcessed,
      sessionScansRemaining,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    await scanActivity.save();
    console.log(`✅ Recorded scan activity: ${scanCount} scans for user ${userId}, session ${sessionId}`);
  } catch (error) {
    console.error('❌ Error recording scan activity:', error);
    // Don't throw error - this shouldn't break the main flow
  }
}

// ---------- Usage Check Function ----------
async function checkUserUsage(userId, scanCount = 1, sessionScans = null) {
  try {
    const user = await User.findById(userId).populate('currentPlan');

    // Handle demo users separately - use session-based scans from database
    if (user && isDemoUser(user)) {
      // Get session from database
      const demoSession = await DemoSession.getOrCreateSession(userId);
      const dbSessionScans = demoSession.sessionScans;

      if (dbSessionScans <= 0) {
        throw new Error('You have used all your demo scans. Please upgrade to a paid plan for unlimited scans.');
      }

      if (scanCount > dbSessionScans) {
        throw new Error(`You only have ${dbSessionScans} demo scan(s) remaining. You are trying to scan ${scanCount} cards.`);
      }

      // Return user with null currentUsage (demo users don't use Usage model)
      return { user, currentUsage: null, isDemo: true, sessionScans: dbSessionScans, demoSession };
    }

    // Regular users (non-demo)
    if (!user || !user.currentPlan) {
      throw new Error('No active plan found');
    }

    // Check if plan is expired
    const now = new Date();
    if (user.planEndDate && user.planEndDate < now) {
      throw new Error('Your plan has expired. Please upgrade to continue.');
    }

    // Get current usage
    const currentUsage = await Usage.getOrCreateUsage(
      user._id,
      user.currentPlan._id,
      user.currentPlan.cardScansLimit
    );

    // Check if user can perform the scan
    if (!currentUsage.canPerformScan()) {
      throw new Error('You have reached your monthly scan limit. Please upgrade your plan.');
    }

    if ((currentUsage.cardScansUsed + scanCount) > currentUsage.cardScansLimit && !user.currentPlan.isUnlimited()) {
      throw new Error(`You can only perform ${currentUsage.getRemainingScans()} more scans this month. Please upgrade your plan.`);
    }

    return { user, currentUsage, isDemo: false };
  } catch (error) {
    throw error;
  }
}

// ---------- Main Controller ----------
async function processBusinessCard(req, res) {
  try {
    const { userId, mode } = req.body;
    
    if (!userId) return res.status(400).json({ error: "userId is required" });

    // Check user usage limits - we'll determine the actual scan count after processing
    let user, currentUsage, isDemo, sessionScans, demoSession;
    try {
      const usageCheck = await checkUserUsage(userId, 1); // Initial check with 1
      user = usageCheck.user;
      currentUsage = usageCheck.currentUsage;
      isDemo = usageCheck.isDemo;
      sessionScans = usageCheck.sessionScans;
      demoSession = usageCheck.demoSession; // For demo users
    } catch (usageError) {
      return res.status(403).json({
        error: usageError.message,
        code: 'USAGE_LIMIT_EXCEEDED'
      });
    }

    let pairedCards = [];

    if (mode === "single") {
      const front = req.files["frontImage"]?.[0];
      const back = req.files["backImage"]?.[0];
      
      if (!front) return res.status(400).json({ error: "Front image is required in single mode" });

      try {
        const frontOCR = await processOCR(front.path);
        fs.unlinkSync(front.path);
        
        if (back) {
          const backOCR = await processOCR(back.path);
          fs.unlinkSync(back.path);
          pairedCards = [mergeCards(frontOCR, backOCR)];
        } else {
          pairedCards = [frontOCR];
        }
      } catch (ocrError) {
        console.error("OCR Error in single mode:", ocrError);
        return res.status(500).json({ error: "OCR processing failed" });
      }
      
    } else if (mode === "bulk") {
      const bulkFiles = req.files["files"] || [];
      if (bulkFiles.length === 0) {
        return res.status(400).json({ error: "No files uploaded for bulk mode" });
      }

      const ocrResults = await processInBatches(
        bulkFiles,
        BULK_OCR_BATCH_SIZE, // Reduced batch size for better reliability (tuned for 100 uploads)
        async (file) => {
          try {
            const result = await processOCR(file.path);
            fs.unlinkSync(file.path);
            return result;
          } catch (error) {
            console.error(`OCR failed for ${file.filename}:`, error);
            fs.unlinkSync(file.path);
            return null;
          }
        }
      );

      // Filter out failed OCR results
      const validOCRResults = ocrResults.filter(Boolean);
      
      pairedCards = pairCards(validOCRResults);
      
    } else {
      return res.status(400).json({ error: "Invalid mode. Use 'single' or 'bulk'" });
    }

    // GPT PARSING + MERGING
    const finalParsed = await parseCardsWithGPT(pairedCards, 5);
    
    // Add metadata and validate
    const validatedCards = finalParsed.map(card => {
      const validated = validateAndScoreCard({
        ...card,
        sourceMode: mode,
        cardId: card.cardId || uuidv4(),
        processedAt: new Date().toISOString()
      });
      return validated;
    }).filter(card => card.isValid); // Only return valid cards

    // Update usage after successful processing - count actual images processed
    let actualScanCount;
    if (mode === "single") {
      // In single mode, count the actual number of images processed (front + back if provided)
      const front = req.files["frontImage"]?.[0];
      const back = req.files["backImage"]?.[0];
      actualScanCount = front ? 1 : 0;
      if (back) actualScanCount += 1;
    } else {
      // In bulk mode, count the actual number of images uploaded (not the final merged cards)
      const bulkFiles = req.files["files"] || [];
      actualScanCount = bulkFiles.length;
    }
    
    try {
      if (isDemo) {
        // Handle demo users - validate session scans
        if (actualScanCount > sessionScans) {
          return res.status(403).json({
            error: `You only have ${sessionScans} demo scan(s) remaining. You tried to scan ${actualScanCount} cards.`,
            code: 'USAGE_LIMIT_EXCEEDED'
          });
        }

        // Decrement session scans in database
        await demoSession.decrementScans(actualScanCount);
        sessionScans = demoSession.sessionScans;
        
        // Record scan activity for demo users
        await recordScanActivity(
          userId, 
          demoSession._id.toString(), 
          actualScanCount, 
          mode, 
          actualScanCount, 
          sessionScans, 
          req
        );
      } else {
        // Handle regular users - use Usage model
        if ((currentUsage.cardScansUsed + actualScanCount) > currentUsage.cardScansLimit && !user.currentPlan.isUnlimited()) {
          return res.status(403).json({
            error: `You can only perform ${currentUsage.getRemainingScans()} more scans this month. Please upgrade your plan.`,
            code: 'USAGE_LIMIT_EXCEEDED'
          });
        }

        await currentUsage.incrementUsage(actualScanCount, mode);
      }
    } catch (usageError) {
      console.error('Error updating usage:', usageError);
      // Don't fail the request if usage update fails
    }

    // COMPLETE

    const response = {
      success: true,
      message: "Processing completed successfully",
      mode,
      data: validatedCards,
      summary: {
        totalProcessed: pairedCards.length,
        validCards: validatedCards.length,
        averageConfidence: Math.round(validatedCards.reduce((sum, card) => sum + card.confidence, 0) / validatedCards.length) || 0
      }
    };

    // Add usage info based on user type
    if (isDemo) {
      // For demo users, return remaining session scans and generate new JWT
      const jwt = require('jsonwebtoken');
      const newToken = jwt.sign(
        { userId: userId, sessionScans: sessionScans },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      response.usage = {
        sessionScans: sessionScans,
        scansThisRequest: actualScanCount,
        isDemo: true
      };
      response.token = newToken; // Return new token with updated session scans
    } else {
      // For regular users, return plan-based usage
      response.usage = {
        cardScansUsed: currentUsage.cardScansUsed,
        cardScansLimit: currentUsage.cardScansLimit,
        remainingScans: currentUsage.getRemainingScans(),
        scansThisRequest: actualScanCount,
        isDemo: false
      };
    }

    return res.json(response);
    
  } catch (err) {
    console.error("❌ OCR Error:", err);
    return res.status(500).json({ error: "OCR processing failed", details: err.message });
  }
}

module.exports = { 
  processBusinessCard,
  // Export helper functions for testing
  extractEmails,
  extractPhones,
  extractWebsites,
  extractNameFromText,
  validateAndScoreCard
};
