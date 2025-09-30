// // services/cardPairingService.js

// function getFingerprint(card) {
//   return {
//     logos: card.logos || [],
//     emails: card.emails || [],
//     phones: card.phones || [],
//     websites: card.websites || [],
//     text: (card.text || "").toLowerCase(),
//   };
// }

// function computeMatchScore(cardA, cardB) {
//   let score = 0;
//   const signals = [];

//   // Strong identifiers
//   if (cardA.emails.some((e) => cardB.emails.includes(e))) {
//     score += 1.0;
//     signals.push("email");
//   }
//   if (cardA.phones.some((p) => cardB.phones.includes(p))) {
//     score += 1.0;
//     signals.push("phone");
//   }
//   if (cardA.websites.some((w) => cardB.websites.includes(w))) {
//     score += 0.8;
//     signals.push("website");
//   }

//   // Medium identifiers
//   if (cardA.logos.some((l) => cardB.logos.includes(l))) {
//     score += 0.5;
//     signals.push("logo");
//   }

//   // Weak identifiers
//   const addressKeywords = [
//     "mumbai", "pune", "delhi", "bangalore", "kolkata", "chennai", "india",
//     "road", "industrial", "area", "village",
//   ];
//   if (addressKeywords.some((k) => cardA.text.includes(k) && cardB.text.includes(k))) {
//     score += 0.2;
//     signals.push("address");
//   }

//   if (/(director|founder|ceo|cto|manager)/i.test(cardA.text) &&
//       /(pvt|private|ltd|llp|inc|solutions|foods|tech|company|enterprises)/i.test(cardB.text)) {
//     score += 0.4;
//     signals.push("role+company");
//   }
//   if (/(director|founder|ceo|cto|manager)/i.test(cardB.text) &&
//       /(pvt|private|ltd|llp|inc|solutions|foods|tech|company|enterprises)/i.test(cardA.text)) {
//     score += 0.4;
//     signals.push("role+company");
//   }

//   const wordsA = cardA.text.split(/\s+/).filter((w) => w.length > 3);
//   const wordsB = cardB.text.split(/\s+/).filter((w) => w.length > 3);
//   const overlapCount = wordsA.filter((w) => wordsB.includes(w)).length;
//   if (overlapCount >= 2) {
//     score += 0.2;
//     signals.push("textOverlap");
//   }

//   return { score, signals };
// }

// function mergeCards(cardA, cardB) {
//   return {
//     filenames: [cardA.filename, cardB.filename],
//     text: [cardA.text, cardB.text].filter(Boolean).join("\n---\n"),
//     logos: Array.from(new Set([...(cardA.logos || []), ...(cardB.logos || [])])),
//     emails: Array.from(new Set([...(cardA.emails || []), ...(cardB.emails || [])])),
//     phones: Array.from(new Set([...(cardA.phones || []), ...(cardB.phones || [])])),
//     websites: Array.from(new Set([...(cardA.websites || []), ...(cardB.websites || [])])),
//   };
// }

// function pairCards(ocrResults, threshold = 0.6) {
//   const used = new Set();
//   const pairs = [];

//   for (let i = 0; i < ocrResults.length; i++) {
//     if (used.has(i)) continue;

//     let bestMatch = -1;
//     let bestScore = 0;
//     let bestSignals = [];

//     const cardA = getFingerprint(ocrResults[i]);

//     for (let j = i + 1; j < ocrResults.length; j++) {
//       if (used.has(j)) continue;

//       const cardB = getFingerprint(ocrResults[j]);
//       const { score, signals } = computeMatchScore(cardA, cardB);

//       if (score > bestScore) {
//         bestScore = score;
//         bestMatch = j;
//         bestSignals = signals;
//       }
//     }

//     const hasStrongEvidence =
//       bestMatch !== -1 &&
//       (ocrResults[i].emails.some((e) => ocrResults[bestMatch].emails.includes(e)) ||
//        ocrResults[i].phones.some((p) => ocrResults[bestMatch].phones.includes(p)) ||
//        ocrResults[i].websites.some((w) => ocrResults[bestMatch].websites.includes(w)));

//     // ✅ New merge condition:
//     // 1. Must have strong evidence (email/phone/website), OR
//     // 2. Score very high (>= 1.2) from multiple signals
//     const mergeAllowed =
//       bestMatch !== -1 &&
//       (hasStrongEvidence || bestScore >= 1.2);

//     if (mergeAllowed) {
//       console.log(
//         `✅ Merging ${ocrResults[i].filename} + ${ocrResults[bestMatch].filename} ` +
//         `(score: ${bestScore.toFixed(2)}, signals: [${bestSignals.join(", ")}])`
//       );
//       used.add(i);
//       used.add(bestMatch);
//       pairs.push(mergeCards(ocrResults[i], ocrResults[bestMatch]));
//     } else {
//       if (bestMatch !== -1) {
//         console.log(
//           `❌ Skipped merge for ${ocrResults[i].filename} + ${ocrResults[bestMatch].filename} ` +
//           `(score: ${bestScore.toFixed(2)}, signals: [${bestSignals.join(", ")}], evidence: ${hasStrongEvidence})`
//         );
//       }
//       used.add(i);
//       pairs.push({
//         filenames: [ocrResults[i].filename],
//         text: ocrResults[i].text,
//         logos: ocrResults[i].logos || [],
//         emails: ocrResults[i].emails || [],
//         phones: ocrResults[i].phones || [],
//         websites: ocrResults[i].websites || [],
//       });
//     }
//   }

//   return pairs;
// }

// module.exports = { pairCards, mergeCards };


// services/cardPairingService.js

function getFingerprint(card) {
  return {
    logos: card.logos || [],
    emails: card.emails || [],
    phones: card.phones || [],
    websites: card.websites || [],
    text: (card.text || "").toLowerCase(),
  };
}

function computeMatchScore(cardA, cardB) {
  let score = 0;
  const signals = [];

  // Strong identifiers
  if (cardA.emails.some((e) => cardB.emails.includes(e))) {
    score += 1.0;
    signals.push("email");
  }
  if (cardA.phones.some((p) => cardB.phones.includes(p))) {
    score += 1.0;
    signals.push("phone");
  }
  if (cardA.websites.some((w) => cardB.websites.includes(w))) {
    score += 0.8;
    signals.push("website");
  }

  // Medium identifiers
  if (cardA.logos.some((l) => cardB.logos.includes(l))) {
    score += 0.5;
    signals.push("logo");
  }

  // Enhanced weak identifiers
  const addressKeywords = [
    "mumbai", "pune", "delhi", "bangalore", "kolkata", "chennai", "india",
    "road", "street", "avenue", "industrial", "area", "village", "sector", "block", "phase"
  ];
  const addressMatches = addressKeywords.filter(k => 
    cardA.text.includes(k) && cardB.text.includes(k)
  ).length;
  if (addressMatches > 0) {
    score += Math.min(0.3, addressMatches * 0.1);
    signals.push(`address(${addressMatches})`);
  }

  // Role + Company patterns (enhanced)
  const rolePatterns = /(director|founder|ceo|cto|manager|president|vp|executive|partner)/i;
  const companyPatterns = /(pvt|private|ltd|llp|inc|solutions|foods|tech|company|enterprises|corporation|group)/i;
  
  if ((rolePatterns.test(cardA.text) && companyPatterns.test(cardB.text)) ||
      (rolePatterns.test(cardB.text) && companyPatterns.test(cardA.text))) {
    score += 0.4;
    signals.push("role+company");
  }

  // Text overlap with better scoring
  const wordsA = cardA.text.split(/\s+/).filter((w) => w.length > 3);
  const wordsB = cardB.text.split(/\s+/).filter((w) => w.length > 3);
  const overlapCount = wordsA.filter((w) => wordsB.includes(w)).length;
  const totalWords = Math.max(wordsA.length, wordsB.length);
  
  if (overlapCount >= 2 && totalWords > 0) {
    const overlapRatio = overlapCount / totalWords;
    score += Math.min(0.3, overlapRatio * 0.5);
    signals.push(`textOverlap(${overlapCount}/${totalWords})`);
  }

  return { score, signals };
}

function mergeCards(cardA, cardB) {
  return {
    filenames: [cardA.filename, cardB.filename].filter(Boolean),
    text: [cardA.text, cardB.text].filter(Boolean).join("\n---\n"),
    logos: Array.from(new Set([...(cardA.logos || []), ...(cardB.logos || [])])),
    emails: Array.from(new Set([...(cardA.emails || []), ...(cardB.emails || [])])),
    phones: Array.from(new Set([...(cardA.phones || []), ...(cardB.phones || [])])),
    websites: Array.from(new Set([...(cardA.websites || []), ...(cardB.websites || [])])),
  };
}

function pairCards(ocrResults, threshold = 0.6) {
  const used = new Set();
  const pairs = [];


  for (let i = 0; i < ocrResults.length; i++) {
    if (used.has(i)) continue;

    let bestMatch = -1;
    let bestScore = 0;
    let bestSignals = [];

    const cardA = getFingerprint(ocrResults[i]);

    for (let j = i + 1; j < ocrResults.length; j++) {
      if (used.has(j)) continue;

      const cardB = getFingerprint(ocrResults[j]);
      const { score, signals } = computeMatchScore(cardA, cardB);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = j;
        bestSignals = signals;
      }
    }

    // Enhanced strong evidence detection
    const hasStrongEvidence = bestMatch !== -1 && (
      (ocrResults[i].emails || []).some((e) => (ocrResults[bestMatch].emails || []).includes(e)) ||
      (ocrResults[i].phones || []).some((p) => (ocrResults[bestMatch].phones || []).includes(p)) ||
      (ocrResults[i].websites || []).some((w) => (ocrResults[bestMatch].websites || []).includes(w))
    );

    // Enhanced merge conditions:
    // 1. Strong evidence (email/phone/website match)
    // 2. Very high score from multiple signals
    // 3. Medium score with logo match (for front/back cards)
    const mergeAllowed = bestMatch !== -1 && (
      hasStrongEvidence ||
      bestScore >= 1.2 ||
      (bestScore >= 0.7 && bestSignals.includes("logo"))
    );

    if (mergeAllowed) {
      used.add(i);
      used.add(bestMatch);
      pairs.push(mergeCards(ocrResults[i], ocrResults[bestMatch]));
    } else {
      if (bestMatch !== -1) {
      }
      used.add(i);
      pairs.push({
        filenames: [ocrResults[i].filename],
        text: ocrResults[i].text,
        logos: ocrResults[i].logos || [],
        emails: ocrResults[i].emails || [],
        phones: ocrResults[i].phones || [],
        websites: ocrResults[i].websites || [],
      });
    }
  }

  return pairs;
}

module.exports = { pairCards, mergeCards };
