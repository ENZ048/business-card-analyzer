
// services/cardMergeService.js

function normalizeCompanyName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeForComparison(str) {
  return str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
}

function normalizePhone(phone) {
  return phone?.replace(/\D/g, '').slice(-10) || ''; // Last 10 digits
}

function getFingerprint(card) {
  return {
    // Updated to match OCR controller field names
    fullName: (card.fullName || "").toLowerCase().trim(),
    company: normalizeCompanyName(card.company || ""),
    jobTitle: (card.jobTitle || "").toLowerCase().trim(),
    emails: (card.emails || []).map((e) => e.toLowerCase().trim()),
    phones: (card.phones || []).map((p) => p.replace(/\D/g, "")), // normalize numbers
    websites: (card.websites || []).map((w) => w.toLowerCase().trim()),
    text: (card.text || "").toLowerCase(),
  };
}

function isSamePerson(cardA, cardB) {
  // Rule 1: Exact email match
  if (cardA.emails.some((e) => cardB.emails.includes(e))) return true;

  // Rule 2: Same phone number (normalized)
  if (cardA.phones.some((p) => cardB.phones.includes(p))) return true;

  // Rule 3: Same website
  if (cardA.websites.some((w) => cardB.websites.includes(w))) return true;

  // Rule 4: Same name + same company
  if (cardA.fullName && cardB.fullName &&
      cardA.fullName === cardB.fullName &&
      cardA.company && cardB.company &&
      cardA.company === cardB.company) return true;

  return false;
}

function isFrontBackPair(cardA, cardB) {
  const noPersonA = !cardA.fullName && !cardA.emails.length && !cardA.phones.length;
  const noPersonB = !cardB.fullName && !cardB.emails.length && !cardB.phones.length;

  const hasCompanyA = !!cardA.company;
  const hasCompanyB = !!cardB.company;

  // Case 1: Same company explicitly
  if (cardA.company && cardB.company && cardA.company === cardB.company) {
    return true;
  }

  // Case 2: One side has company only, other side has people only
  if ((noPersonA && hasCompanyA && !hasCompanyB && !noPersonB) ||
      (noPersonB && hasCompanyB && !hasCompanyA && !noPersonA)) {
    return true;
  }

  // Case 3: Check for similar company names (fuzzy matching)
  if (cardA.company && cardB.company) {
    const companyA = normalizeForComparison(cardA.company);
    const companyB = normalizeForComparison(cardB.company);
    
    // Check if one is a substring of the other (for brand vs legal name)
    if ((companyA.includes(companyB) && companyB.length > 3) ||
        (companyB.includes(companyA) && companyA.length > 3)) {
      return true;
    }
  }

  return false;
}

function mergeParsedCards(cards) {
  if (!cards || cards.length === 0) return [];
  
  const merged = [];

  for (const card of cards) {
    const fp = getFingerprint(card);

    let found = false;
    for (const entity of merged) {
      const fpEntity = getFingerprint(entity);

      // Merge as same person
      if (isSamePerson(fp, fpEntity)) {
        // Merge arrays while preserving uniqueness
        entity.emails = [...new Set([...(entity.emails || []), ...(card.emails || [])])];
        entity.phones = [...new Set([...(entity.phones || []), ...(card.phones || [])])];
        entity.websites = [...new Set([...(entity.websites || []), ...(card.websites || [])])];
        
        // Merge text
        if (card.text && !entity.text.includes(card.text)) {
          entity.text += " " + card.text;
        }
        
        // Preserve non-empty values
        entity.fullName = entity.fullName || card.fullName;
        entity.company = entity.company || card.company;
        entity.jobTitle = entity.jobTitle || card.jobTitle;
        entity.address = entity.address || card.address;
        
        found = true;
        break;
      }

      // Merge as front/back of same company card
      if (isFrontBackPair(fp, fpEntity)) {
        // Merge text
        if (card.text && !entity.text.includes(card.text)) {
          entity.text += " " + card.text;
        }
        
        // Merge contact info
        entity.emails = [...new Set([...(entity.emails || []), ...(card.emails || [])])];
        entity.phones = [...new Set([...(entity.phones || []), ...(card.phones || [])])];
        entity.websites = [...new Set([...(entity.websites || []), ...(card.websites || [])])];
        
        // Fill in missing fields
        entity.fullName = entity.fullName || card.fullName;
        entity.company = entity.company || card.company;
        entity.jobTitle = entity.jobTitle || card.jobTitle;
        entity.address = entity.address || card.address;
        
        found = true;
        break;
      }
    }

    if (!found) {
      merged.push({ ...card });
    }
  }

  console.log(`🔄 Card merge complete: ${cards.length} cards → ${merged.length} unique entities`);
  return merged;
}

module.exports = { mergeParsedCards, isSamePerson, isFrontBackPair, getFingerprint };
