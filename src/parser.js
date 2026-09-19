/**
 * Parser for /hisob expense messages.
 *
 * Supported formats:
 * - /hisob такси 20000
 * - /hisob такси 20 000
 * - /hisob обед в ресторане 150 000
 * - /hisob продукты 1250.50
 * - /hisob продукты 1250,50
 * - /hisob 50000 обед
 * - /hisob@bot_username такси 20000
 */

/**
 * Normalizes number string by removing spaces, commas to dots, etc.
 * @param {string} str
 * @returns {number|null}
 */
function parseNumericAmount(str) {
  if (!str) return null;
  // Replace comma with dot for decimal support
  const cleaned = str.replace(/\s+/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Parses a telegram message text for /hisob command.
 * @param {string} rawText
 * @returns {{ success: boolean, title?: string, amount?: number, rawAmount?: string, error?: string }}
 */
export function parseExpenseCommand(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'Текст сообщения пуст' };
  }

  const trimmed = rawText.trim();

  // Check if message starts with /hisob (case-insensitive, optional @bot_username)
  const hisobRegex = /^\/hisob(?:@\w+)?(?:\s+(.*))?$/is;
  const match = trimmed.match(hisobRegex);

  if (!match) {
    return { success: false, error: 'Сообщение не начинается с команды /hisob' };
  }

  const payload = match[1] ? match[1].trim() : '';
  if (!payload) {
    return {
      success: false,
      error: 'Не указаны данные расхода. Пример: /hisob такси 20000'
    };
  }

  // Remove common trailing currency units if present (например: сум, sum, so'm, som, руб, rub, $, usd)
  const sanitizedPayload = payload
    .replace(/\s*(?:so['’`]?m|сум|sum|руб(?:лей|ля|\.)?|rub|\$|usd|eur|€)\s*$/i, '')
    .trim();

  // Pattern 1: Amount at the END: "такси 20 000" or "обед в кафе 50000" or "продукты 125.50"
  // Look for digits (possibly separated by spaces/dots/commas) at the end of the line
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
        rawAmount
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
        rawAmount
      };
    }
  }

  return {
    success: false,
    error: 'Не удалось определить название расхода и сумму. Пример: /hisob такси 20000'
  };
}
