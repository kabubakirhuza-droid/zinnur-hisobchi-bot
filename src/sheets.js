import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

export const CATEGORIES = [
  // Xodimlar
  { key: 'ustozlar_av', label: 'Ustozlar av.', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'ustozlar_bonus', label: 'Ustozlar bonus', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'oquv_bolimi', label: "O'quv bo'limi", group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'oquv_bolimi_bonus', label: "O'quv bo'limi bonus", group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'farroshlar_oklad', label: 'Farroshlar oklad', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'farroshlar_bonus', label: 'Farroshlar bonus', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'pechat_av', label: 'pechat Av.', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'admin_av', label: 'Admin AV.', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'admin_bonus', label: 'Admin bonus', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'taminot', label: "Ta'minot", group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'taminot_kpi', label: "Ta'minot KPI", group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'fin_otdel', label: 'Fin otdel', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'coo', label: 'COO', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'n_av', label: 'N. av', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'yurist', label: 'Yurist', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'hr_oylik', label: 'HR oylik', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'hr_xarajat', label: 'HR xarajat', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'sotuv_konsultant', label: 'Sotuv konsultant', group: 'xodimlar', groupName: '👥 Xodimlar' },
  { key: 'sotuv_av', label: 'Sotuv av.', group: 'xodimlar', groupName: '👥 Xodimlar' },

  // Ofis & Xo'jalik
  { key: 'tushlik', label: 'Tushlik', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'mini_taom', label: 'Mini taom', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'arenda', label: 'Arenda', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'mini_obsh', label: 'Mini obsh.', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'gigiyena_va_stakan', label: 'Gigiyena va stakan', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'kommunal', label: 'Kommunal', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'umumiy', label: 'Umumiy', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'obw_1_marotalik', label: 'Obw 1 marotalik', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'pechat', label: 'Pechat', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'programma', label: 'Programma', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'remont', label: 'Remont', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },
  { key: 'org_tex', label: 'org. Tex', group: 'ofis', groupName: '🏢 Ofis & Xo‘jalik' },

  // Marketing & Sotuv
  { key: 'marketing_okl', label: 'Marketing + okl', group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'marketing_kpi', label: 'Marketing KPI', group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'target', label: 'Target', group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'savdo_bonus', label: 'Savdo bonus', group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'marketing_harajat', label: 'marketing harajat', group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'oqish_motivya', label: "O'qish motiv-ya", group: 'marketing', groupName: '📢 Marketing & Savdo' },
  { key: 'sotish_uchun', label: 'Sotish uchun', group: 'marketing', groupName: '📢 Marketing & Savdo' },

  // Boshqa & Qarz
  { key: 'sergeliga_qarz', label: 'Sergeliga qarz', group: 'boshqa', groupName: '🔄 Qarz & Boshqa' },
  { key: 'onlinega_qarz', label: 'Onlinega qarz', group: 'boshqa', groupName: '🔄 Qarz & Boshqa' },
  { key: 'kutilmagan_xarajat', label: 'Kutilmagan xarajat', group: 'boshqa', groupName: '🔄 Qarz & Boshqa' },
  { key: 'obmen', label: 'Obmen', group: 'boshqa', groupName: '🔄 Qarz & Boshqa' },
  { key: 'pul_qaytarish', label: 'Pul qaytarish', group: 'boshqa', groupName: '🔄 Qarz & Boshqa' }
];

export const GROUPS = [
  { key: 'xodimlar', label: '👥 Xodimlar (19 ta)' },
  { key: 'ofis', label: '🏢 Ofis & Xo‘jalik (11 ta)' },
  { key: 'marketing', label: '📢 Marketing & Savdo (7 ta)' },
  { key: 'boshqa', label: '🔄 Qarz & Boshqa (5 ta)' }
];

export function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['`’‘]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function indexToCol(index) {
  let col = '';
  let temp = index;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

let sheetsClient = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  let auth;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  } else {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);
    if (fs.existsSync(resolvedPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: resolvedPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      throw new Error(`Google credentials not found at ${resolvedPath}`);
    }
  }

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Gets sheet metadata and finds or creates the current month's columns block in 'X N'.
 */
export async function getOrInitMonthBlock(spreadsheetId, sheetTitle = 'X N', date = new Date()) {
  const sheets = await getSheetsClient();
  const currentMonthUz = UZ_MONTHS[date.getMonth()];
  
  // Read top 2 rows to find month and category columns
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:ZZ2`
  });

  const row1 = res.data.values?.[0] || [];
  const row2 = res.data.values?.[1] || [];

  // Check if current month exists in row 1
  let monthColIndex = -1;
  for (let c = 0; c < row1.length; c++) {
    if (row1[c] && normalizeName(row1[c]) === normalizeName(currentMonthUz)) {
      monthColIndex = c;
      break;
    }
  }

  // If current month does NOT exist in sheet, create/insert 88 columns on the left (at index 2 / col C)
  if (monthColIndex === -1) {
    console.log(`⚡ Oy "${currentMonthUz}" topilmadi! Chap tomonda yangi oy ustunlari blokini yaratmoqda...`);
    
    // Get sheetId for 'X N'
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = meta.data.sheets.find(s => s.properties.title === sheetTitle);
    if (!targetSheet) {
      throw new Error(`Sheet "${sheetTitle}" not found in spreadsheet`);
    }
    const sheetId = targetSheet.properties.sheetId;

    // 1. Insert 88 columns at index 2
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 2,
                endIndex: 2 + 88
              },
              inheritFromBefore: false
            }
          }
        ]
      }
    });

    // 2. Build headers for the new month block
    const newRow1 = [currentMonthUz];
    const newRow2 = [];
    for (const cat of CATEGORIES) {
      newRow2.push(cat.label);
      newRow2.push(''); // empty for description subcolumn
    }
    // Pad to 88 columns
    while (newRow2.length < 88) newRow2.push('');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetTitle}'!C1:C1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow1] }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetTitle}'!C2:${indexToCol(2 + 87)}2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow2] }
    });

    // 3. Set bottom summary formulas for row 38 (=SUM(C3:C36), =SUM(E3:E36)...)
    const formulaRow = [];
    for (let c = 2; c < 2 + 88; c += 2) {
      const colLetter = indexToCol(c);
      formulaRow.push(`=SUM(${colLetter}3:${colLetter}36)`);
      formulaRow.push('');
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetTitle}'!C38:${indexToCol(2 + 87)}38`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [formulaRow] }
    });

    monthColIndex = 2;
  }

  // Build category column map for the active month
  const categoryMap = {};
  for (let c = monthColIndex; c < monthColIndex + 88 && c < (row2.length + 88); c += 2) {
    const header = row2[c] || CATEGORIES[(c - monthColIndex) / 2]?.label;
    if (header && header.trim()) {
      categoryMap[normalizeName(header)] = {
        colIndex: c,
        sumCol: indexToCol(c),
        descCol: indexToCol(c + 1),
        header: header.trim()
      };
    }
  }

  // Also map all known CATEGORIES by key and normalized label
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const c = monthColIndex + (i * 2);
    const existing = categoryMap[normalizeName(cat.label)];
    if (!existing) {
      categoryMap[normalizeName(cat.label)] = {
        colIndex: c,
        sumCol: indexToCol(c),
        descCol: indexToCol(c + 1),
        header: cat.label
      };
    }
    categoryMap[cat.key] = categoryMap[normalizeName(cat.label)];
  }

  return {
    monthName: currentMonthUz,
    monthColIndex,
    categoryMap
  };
}

/**
 * Appends or accumulates an expense item in sheet 'X N'.
 *
 * @param {string} categoryKeyOrLabel
 * @param {Object} item
 * @param {string} item.expenseTitle
 * @param {number} item.amount
 * @param {Date} [item.date]
 * @returns {Promise<Object>}
 */
export async function appendExpenseByCategory(categoryKeyOrLabel, { expenseTitle, amount, date = new Date() }) {
  const spreadsheetId = process.env.SPREADSHEET_ID || '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE';
  const sheetTitle = process.env.SPREADSHEET_SHEET_NAME && process.env.SPREADSHEET_SHEET_NAME !== 'AUTO' 
    ? process.env.SPREADSHEET_SHEET_NAME 
    : 'X N';

  const sheets = await getSheetsClient();
  const { monthName, categoryMap } = await getOrInitMonthBlock(spreadsheetId, sheetTitle, date);

  const normKey = normalizeName(categoryKeyOrLabel);
  const targetColInfo = categoryMap[normKey] || categoryMap[categoryKeyOrLabel];

  if (!targetColInfo) {
    throw new Error(`Категория "${categoryKeyOrLabel}" не найдена в таблице!`);
  }

  // Day of month: 1..31 -> Row 3..33 (rowIndex = day + 2)
  const day = date.getDate();
  const rowIndex = day + 2;

  // In this table, amounts are stored in thousands (ming so'm): e.g. 25000 -> 25, 145000 -> 145
  let sheetAmount = amount;
  if (amount >= 1000) {
    sheetAmount = amount / 1000;
  }

  // Read current day cell value
  const cellRange = `'${sheetTitle}'!${targetColInfo.sumCol}${rowIndex}:${targetColInfo.descCol}${rowIndex}`;
  const currentCellRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: cellRange
  });

  const existingRow = currentCellRes.data.values?.[0] || [];
  const existingSum = parseFloat(String(existingRow[0] || '0').replace(/\s+/g, '').replace(/,/g, '.')) || 0;
  const existingDesc = (existingRow[1] || '').trim();

  let newSum;
  let newDesc;

  if (existingSum > 0 || existingDesc) {
    newSum = existingSum + sheetAmount;
    newDesc = existingDesc 
      ? `${existingDesc}, ${expenseTitle} ${sheetAmount}` 
      : `${expenseTitle} ${sheetAmount}`;
  } else {
    newSum = sheetAmount;
    newDesc = expenseTitle;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newSum, newDesc]]
    }
  });

  return {
    month: monthName,
    day,
    row: rowIndex,
    category: targetColInfo.header,
    range: cellRange,
    amount: newSum,
    description: newDesc,
    addedAmount: sheetAmount
  };
}
