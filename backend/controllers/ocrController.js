const vision = require('@google-cloud/vision');
const fs = require('fs');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Init Vision client
let client;
if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
  client = new vision.ImageAnnotatorClient({
    credentials,
    projectId: credentials.project_id,
  });
  console.log("✅ Google Vision client initialized with inline credentials");
} else {
  client = new vision.ImageAnnotatorClient();
  console.log("✅ Google Vision client initialized with file credentials");
}

// Regex patterns for hints
const phoneRegex = /(\+?\d[\d\s\-().]{7,})/g;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;

async function parseWithGPT4o(rawText, logos = []) {
  const phonesFound = rawText.match(phoneRegex) || [];
  const emailsFound = rawText.match(emailRegex) || [];

  console.log("📌 OCR Raw Text:", rawText);
  console.log("📌 Regex Phones:", phonesFound);
  console.log("📌 Regex Emails:", emailsFound);
  console.log("📌 Logos:", logos);

  const input = `
OCR Text:
${rawText}

Logos Detected:
${logos.join(", ") || "None"}

Regex Hints:
Phones detected: ${phonesFound.join(", ") || "None"}
Emails detected: ${emailsFound.join(", ") || "None"}
`;

  const systemPrompt = `You are an expert system for extracting structured contact information from messy OCR text.

Output must be STRICT JSON with this schema:
{
  "fullName": "string",
  "title": "string",
  "company": "string",
  "phoneNumbers": ["string"],
  "emails": ["string"],
  "website": "string",
  "address": "string"
}

Rules:
- Always return valid JSON (no comments, no explanations).
- If multiple phone numbers or emails exist, include them all in arrays.
- If a field is not present, return "" or [].
- Use OCR text, regex hints, and logos together to guess missing fields.
- Normalize phone numbers into international format if possible.
- Pay extra attention to extracting ALL phone numbers and ALL emails.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      response_format: { type: "json_object" },
    });

    const jsonString = response.choices?.[0]?.message?.content || "{}";
    console.log("📌 GPT Raw Response:", jsonString);

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("❌ GPT parsing error:", err);
    return {
      fullName: "",
      title: "",
      company: "",
      phoneNumbers: [],
      emails: [],
      website: "",
      address: "",
    };
  }
}

exports.processBusinessCard = async (req, res) => {
  try {
    const results = [];

    for (const file of req.files) {
      console.log(`📂 Processing file: ${file.originalname}`);

      // Vision API OCR
      const [textResult] = await client.textDetection(file.path);
      const [logoResult] = await client.logoDetection(file.path);

      const rawText = textResult.textAnnotations.map(t => t.description).join("\n");
      const logos = logoResult.logoAnnotations.map(l => l.description);

      console.log("✅ Vision OCR done for:", file.originalname);

      // Parse with GPT-4o-mini
      const parsed = await parseWithGPT4o(rawText, logos);

      results.push({
        filename: file.originalname,
        ...parsed,
        logos,
        rawText,
      });

      // cleanup temp files
      fs.unlink(file.path, () => {});
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ OCR/Parsing failed:", err);
    res.status(500).json({ success: false, message: "Processing failed", error: err.message });
  }
};
