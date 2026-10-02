import { CATEGORIES, normalizeName } from './sheets.js';

function parseNumericAmount(str) {
  if (!str) return null;
  const cleaned = str.replace(/\s+/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

function extractBranch(text, chatTitle = '') {
  let cleaned = text;
  let branch = null;

  // Check in text for explicit branch mentions
  if (/\b(?:sergeli|сергели|sergili|#sergeli)\b/i.test(cleaned)) {
    branch = 'sergeli';
    cleaned = cleaned.replace(/\b(?:sergeli|сергели|sergili|#sergeli)\b/gi, '').trim();
  } else if (/\b(?:uchtepa|учтепа|uсhteрa|#uchtepa)\b/i.test(cleaned)) {
    branch = 'uchtepa';
    cleaned = cleaned.replace(/\b(?:uchtepa|учтепа|uсhteрa|#uchtepa)\b/gi, '').trim();
  } else if (/sergeli|сергели/i.test(chatTitle)) {
    branch = 'sergeli';
  } else if (/uchtepa|учтепа/i.test(chatTitle)) {
    branch = 'uchtepa';
  } else {
    branch = 'uchtepa'; // Default branch
  }

  return { cleaned, branch };
}

function extractHashtagCategory(text) {
  const hashMatch = text.match(/#([\w\u0400-\u04FF_'-]+)/i);
  if (!hashMatch) return { cleanedText: text, matchedCategory: null };

  const rawTag = hashMatch[1];
  const normTag = normalizeName(rawTag);

  if (normTag === 'uchtepa' || normTag === 'sergeli') {
    return { cleanedText: text, matchedCategory: null };
  }

  const matched = CATEGORIES.find(c => {
    return normalizeName(c.key) === normTag || normalizeName(c.label) === normTag;
  });

  const cleanedText = text.replace(hashMatch[0], '').trim();
  return { cleanedText, matchedCategory: matched || null, rawTag };
}

/**
 * Parses a telegram message text for /hisob command with branch detection.
 *
 * Formats:
 * - /hisob uchtepa taksi 25000
 * - /hisob sergeli taksi 25000
 * - /hisob taksi 25000 (auto-detects from group or defaults to uchtepa)
 * - /hisob #sergeli #tushlik 35000 osh
 */
export function parseExpenseCommand(rawText, chatTitle = '') {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'Текст сообщения пуст' };
  }

  const trimmed = rawText.trim();
  const hisobRegex = /^\/(?:hisob|xarajat)(?:_(uchtepa|sergeli))?(?:@\w+)?(?:\s+(.*))?$/is;
  const match = trimmed.match(hisobRegex);

  if (!match) {
    return { success: false, error: 'Сообщение не начинается с команды /hisob' };
  }

  const cmdBranch = match[1] ? match[1].toLowerCase() : null;
  let payload = match[2] ? match[2].trim() : '';
  if (!payload) {
    return {
      success: false,
      error: 'Не указаны данные расхода. Пример: /hisob_uchtepa taksi 20000 или /hisob_sergeli taksi 20000'
    };
  }

  // 1. Extract branch
  let branch = cmdBranch;
  if (!branch) {
    const extracted = extractBranch(payload, chatTitle);
    payload = extracted.cleaned;
    branch = extracted.branch;
  } else {
    // Clean branch keywords from payload if any
    const extracted = extractBranch(payload, chatTitle);
    payload = extracted.cleaned;
  }

  // 2. Extract hashtag category
  const { cleanedText, matchedCategory } = extractHashtagCategory(payload);
  payload = cleanedText;

  const sanitizedPayload = payload
    .replace(/\s*(?:so['’`]?m|сум|sum|руб(?:лей|ля|\.)?|rub|\$|usd|eur|€)\s*$/i, '')
    .trim();

  // Pattern 1: Amount at the END
  const endAmountRegex = /^(.*?)\s+((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s*$/;
  const endMatch = sanitizedPayload.match(endAmountRegex);

  if (endMatch) {
    const title = endMatch[1].trim();
    const rawAmount = endMatch[2].trim();
    const amount = parseNumericAmount(rawAmount);

    if (title && amount !== null) {
      return {
        success: true,
        title,
        amount,
        rawAmount,
        branch,
        category: matchedCategory
      };
    }
  }

  // Pattern 2: Amount at the START
  const startAmountRegex = /^((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s+(.*?)\s*$/;
  const startMatch = sanitizedPayload.match(startAmountRegex);

  if (startMatch) {
    const rawAmount = startMatch[1].trim();
    const title = startMatch[2].trim();
    const amount = parseNumericAmount(rawAmount);

    if (title && amount !== null) {
      return {
        success: true,
        title,
        amount,
        rawAmount,
        branch,
        category: matchedCategory
      };
    }
  }

  return {
    success: false,
    error: 'Не удалось определить название расхода и сумму. Пример: /hisob uchtepa taksi 20000'
  };
}
