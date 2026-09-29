import { CATEGORIES, normalizeName } from './sheets.js';

/**
 * Normalizes number string by removing spaces, commas to dots, etc.
 * @param {string} str
 * @returns {number|null}
 */
function parseNumericAmount(str) {
  if (!str) return null;
  const cleaned = str.replace(/\s+/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Extracts hashtag matching any category.
 * e.g. #tushlik, #arenda, #remont, #ustozlar_av
 */
function extractHashtagCategory(text) {
  const hashMatch = text.match(/#([\w\u0400-\u04FF_'-]+)/i);
  if (!hashMatch) return { cleanedText: text, matchedCategory: null };

  const rawTag = hashMatch[1];
  const normTag = normalizeName(rawTag);

  const matched = CATEGORIES.find(c => {
    return normalizeName(c.key) === normTag || normalizeName(c.label) === normTag;
  });

  const cleanedText = text.replace(hashMatch[0], '').trim();
  return { cleanedText, matchedCategory: matched || null, rawTag };
}

/**
 * Parses a telegram message text for /hisob command.
 * @param {string} rawText
 * @returns {{ success: boolean, title?: string, amount?: number, rawAmount?: string, category?: Object, error?: string }}
 */
export function parseExpenseCommand(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'Текст сообщения пуст' };
  }

  const trimmed = rawText.trim();

  // Match /hisob or /xarajat
  const hisobRegex = /^\/(?:hisob|xarajat)(?:@\w+)?(?:\s+(.*))?$/is;
  const match = trimmed.match(hisobRegex);

  if (!match) {
    return { success: false, error: 'Сообщение не начинается с команды /hisob' };
  }

  let payload = match[1] ? match[1].trim() : '';
  if (!payload) {
    return {
      success: false,
      error: 'Не указаны данные расхода. Пример: /hisob такси 20000'
    };
  }

  // Check for hashtag category
  const { cleanedText, matchedCategory } = extractHashtagCategory(payload);
  payload = cleanedText;

  // Remove trailing currency signs
  const sanitizedPayload = payload
    .replace(/\s*(?:so['’`]?m|сум|sum|руб(?:лей|ля|\.)?|rub|\$|usd|eur|€)\s*$/i, '')
    .trim();

  // Pattern 1: Amount at the END: "такси 20 000" or "obed 45000"
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
        category: matchedCategory
      };
    }
  }

  // Pattern 2: Amount at the START: "20 000 такси" or "50000 обед"
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
        category: matchedCategory
      };
    }
  }

  return {
    success: false,
    error: 'Не удалось определить название расхода и сумму. Пример: /hisob такси 20000'
  };
}
