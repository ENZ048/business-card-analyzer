// services/gptService.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Calls GPT-4o-mini to parse OCR text into structured JSON.
 * @param {string} text - Combined OCR text (front + back).
 * @param {string[]} emails - Extracted email hints.
 * @param {string[]} phones - Extracted phone hints.
 * @param {string[]} logos - Detected logo/company hints.
 * @returns {Promise<Object>} Parsed contact JSON.
 */
async function callGPTParser(text, emails = [], phones = [], logos = []) {
  const prompt = `
You are a business card parser. 
Your task is to extract structured contact details from OCR text.
Merge duplicated information and ignore irrelevant text.

Hints:
- Emails: ${emails.join(", ") || "None"}
- Phones: ${phones.join(", ") || "None"}
- Logos/Company hints: ${logos.join(", ") || "None"}

OCR Text:
${text}

Return ONLY valid JSON in this format:
{
  "fullName": "",
  "title": "",
  "company": "",
  "phoneNumbers": [],
  "emails": [],
  "website": "",
  "address": ""
}
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" } // Ensures strict JSON
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error("GPT Parser Error:", err);
    return {
      fullName: "",
      title: "",
      company: "",
      phoneNumbers: phones,
      emails: emails,
      website: "",
      address: "",
      error: "Parsing failed"
    };
  }
}

module.exports = { callGPTParser };
