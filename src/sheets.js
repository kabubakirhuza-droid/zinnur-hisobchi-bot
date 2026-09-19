import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Category mapping according to Google Sheet columns:
 * A-B: svet uchun (A: Nomi, B: narh)
 * C-D: gaz uchun  (C: nomi, D: Narh)
 * E-F: ovqat      (E: Nomi, F: Narh)
 * G-H: kunlik xarajat (G: Nomi, H: Narh)
 * I-J: oylik      (I: Nomi, J: Narh)
 * K-L: avans      (K: Nomi, L: Narh)
 */
export const CATEGORIES = {
  svet_uchun: {
    key: 'svet_uchun',
    label: '💡 Svet uchun',
    sheetTitleHeader: 'svet uchun',
    colStart: 'A',
    colEnd: 'B',
    colIndex: 0
  },
  gaz_uchun: {
    key: 'gaz_uchun',
    label: '🔥 Gaz uchun',
    sheetTitleHeader: 'gaz uchun',
    colStart: 'C',
    colEnd: 'D',
    colIndex: 2
  },
  ovqat: {
    key: 'ovqat',
    label: '🍲 Ovqat',
    sheetTitleHeader: 'ovqat',
    colStart: 'E',
    colEnd: 'F',
    colIndex: 4
  },
  kunlik_xarajat: {
    key: 'kunlik_xarajat',
    label: '🛒 Kunlik xarajat',
    sheetTitleHeader: 'kunlik xarajat',
    colStart: 'G',
    colEnd: 'H',
    colIndex: 6
  },
  oylik: {
    key: 'oylik',
    label: '💵 Oylik',
    sheetTitleHeader: 'oylik',
    colStart: 'I',
    colEnd: 'J',
    colIndex: 8
  },
  avans: {
    key: 'avans',
    label: '💳 Avans',
    sheetTitleHeader: 'avans',
    colStart: 'K',
    colEnd: 'L',
    colIndex: 10
  }
};

let sheetsClient = null;
let cachedSheetTitle = null;

/**
 * Initializes and returns the authenticated Google Sheets client.
 */
export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  let auth;

  // Option 1: Direct JSON string passed via Environment Variable (Ideal for Render.com / Cloud)
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } catch (e) {
      throw new Error(`Ошибка парсинга переменной GOOGLE_CREDENTIALS_JSON: ${e.message}`);
    }
  }
  // Option 2: JSON credentials file on disk
  else {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);

    if (fs.existsSync(resolvedPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: resolvedPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      throw new Error(
        `Файл ключа Google Service Account не найден по пути "${resolvedPath}", и переменная GOOGLE_CREDENTIALS_JSON не задана.`
      );
    }
  }

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Resolves the target sheet title (auto-detects first sheet if configured).
 */
export async function getTargetSheetTitle(spreadsheetId) {
  if (cachedSheetTitle) return cachedSheetTitle;

  const configured = process.env.SPREADSHEET_SHEET_NAME;
  if (configured && configured !== 'AUTO') {
    cachedSheetTitle = configured;
    return cachedSheetTitle;
  }

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title'
  });

  const firstSheet = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';
  cachedSheetTitle = firstSheet;
  return cachedSheetTitle;
}

/**
 * Appends an expense item under a specific category column pair.
 * Searches for the next available row (starting from row 3) in that category's columns.
 *
 * @param {string} categoryKey - One of CATEGORIES keys (e.g. 'svet_uchun', 'ovqat')
 * @param {Object} item
 * @param {string} item.expenseTitle - Description / name of expense
 * @param {number} item.amount - Numeric amount
 * @returns {Promise<Object>}
 */
export async function appendExpenseByCategory(categoryKey, { expenseTitle, amount }) {
  const category = CATEGORIES[categoryKey];
  if (!category) {
    throw new Error(`Неизвестная категория: ${categoryKey}`);
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID не настроен в файле .env');
  }

  const sheets = await getSheetsClient();
  const sheetTitle = await getTargetSheetTitle(spreadsheetId);

  // Read existing rows for this specific column pair starting from row 3
  const rangeToRead = `'${sheetTitle}'!${category.colStart}3:${category.colEnd}1000`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rangeToRead
  });

  const rows = response.data.values || [];
  
  // Find the first empty row index (0-indexed relative to row 3)
  let targetRelativeRow = rows.length;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nameCell = row && row[0] ? String(row[0]).trim() : '';
    const amountCell = row && row[1] ? String(row[1]).trim() : '';
    if (!nameCell && !amountCell) {
      targetRelativeRow = i;
      break;
    }
  }

  // Row numbers in Sheets are 1-based, starting from row 3
  const actualRowNumber = 3 + targetRelativeRow;
  const updateRange = `'${sheetTitle}'!${category.colStart}${actualRowNumber}:${category.colEnd}${actualRowNumber}`;

  const updateResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[expenseTitle, amount]]
    }
  });

  return {
    category: category.label,
    row: actualRowNumber,
    range: updateRange,
    data: updateResponse.data
  };
}
