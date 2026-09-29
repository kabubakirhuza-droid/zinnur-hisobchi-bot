import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

export const BRANCHES = {
  uchtepa: {
    key: 'uchtepa',
    name: '🏢 Uchtepa',
    spreadsheetId: '1pOyuFZkQ4AbjELBK0753uUkgGVJ_UNfMBEGqpK9M6hc',
    sheetTitle: 'X N',
    adminIds: ['716752890']
  },
  sergeli: {
    key: 'sergeli',
    name: '🏬 Sergeli',
    spreadsheetId: '1uYxa1MNQxx0cmvScS69JpBtrnSpkVkrkpsG_nF9x6Mc',
    sheetTitle: 'X N',
    adminIds: ['716752890']
  }
};

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

const FALLBACK_CREDENTIALS = {
  type: "service_account",
  project_id: "gen-lang-client-0857145113",
  private_key_id: "9bfbd85ccea78708940547cefd614e55c397b955",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDtscHRWnFoL6dp\nH2UlBG3e+LtDQAZkqj5DFszVkdbH5iDfpFS9rOOce3ajGISwwmBPvqV2D7PpSWet\nZm59VbtNzzXImZ3XduZ1iBNjU5K283r31VIN2w/YzNnjkGPQBevvSzneGNK7cq9I\nkqzUFPD9DS84ZHHs2evuFfj/YjYomEQ96EtaB9wF3UI7z/5zPpXHLRY8JF1p0f95\nXzeJ+3permLxBE3VOtrDGAgoqoUQAQgDXPQgdTTOYyZfjmI9CDcYJGRwSD0fIIuM\nzk756vRSSNgsFJv7rGmwQhltujK6V8gn0F6by0PqxzJ10IW8KuzedZ/LdOm60QYV\n8QyLkx0xAgMBAAECggEAAoRdXxAsH0RR64UPlyLC3xeXNBEbgDllS2SUaraOpbNE\nKdodo5yPFHsiOHvr+8szJeUI74UfDJtgY6+v/9fGkf5dvXATAdMagagdPHIIHbPa\nW4GAyvDE7DDPJd/DjtJhOzl6tWVh5eZDAOu8tMo7+xIGq/w0UKPGIdFNv7aUiD1/\nUb3Kbj7NBN5+5GKAlDoC7SC7+KQX2YTYkK+Rcg6Tw/RfkIHecuLzLjUorw49gCrj\nSAiROuTf9Zyf717mlUny58mhypzOfr2f81mbo+zK1Pdb6ZfEP7ieTd3yvg3Gpg6y\npJ3id0uAKOl8QxtL3ggMTa1p9AfHl/KNX+6ZZkkzmQKBgQD8A66NyVvoq4h8Yeyn\nOxIW/8b3SUzXr19Yz1blzlC+BPYFFtSUbGigpg3w8gsyPbzBKgNSRXgjgXRAvu8X\noNEEFi7JOOQlYxepDm8m5oQayWBHEX+y/xIWLGIrXznyGH8su/vzD4WMPr3xMNLO\nqbDjZP9pbMVbySQfkx3S68gF9wKBgQDxdBk3R+ruT3GiHT80RrYHlJ6FugLeZtND\n+mX3ILsIJI0EQmshJ2IQX0/ZKb1dvLqFN9aVgyhHtvQ6eHmu3+R/1MIecjDHfIs2\nPN/l2bKPHGNygT9jpH2LZ78+eIvMIPsF6Q2QvPnuHQsI+2Dz0NkVYThgoHG41ZZH\ntzcRdYUMFwKBgD+q+nVtsp+UfnXWE4CoRsiys+STiytObgs0zqJePj3TaQgeHXSl\n8sTrTshZjgSSXlZ6s74cON7XfLRCyIqyoTukEwvZKKJdZ4PZVrGAOU2/JGiv/hAN\nqtcZPW/xreUA1VhK4bslZ7rnuvrtN8ToT/0S7ggHZ9DpfwvPEhDQaoc/AoGAa0JQ\nxU7sXQrrhsGJRza2PC3YMb2M8rEo3oTIcPyYOSjLf/3lSygMlwtQFD9HgPGKxg0l\nBOvro9fxLFxCad3JysN/rDi71JJN4T0vlRKdEJfi0YX628/BeYEP4rd4Gqj3+gsq\nXIamXBGIymepDQZUuPukKMB9ZEd1Z8xK6TWUcecCgYA6pshw86TMsEcFe0p33O6v\nuBYM0/aCooyvP2ybPQT+rAHnZOg4OFExNKv+KZoZe3aQ7i3iPQDcbEpDELlW93gO\n75r0+c7RHZN5gq/QuwdA+qHp/5uoG1+0q8RL977JVvsPCcEn3W2Alye+/g36DGZv\nTdRBIfe/EwqG19eKIHsquA==\n-----END PRIVATE KEY-----\n",
  client_email: "expense-bot@gen-lang-client-0857145113.iam.gserviceaccount.com"
};

let sheetsClient = null;

export async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  let auth;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } catch (e) {
      auth = new google.auth.GoogleAuth({
        credentials: FALLBACK_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    }
  } else {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);
    if (fs.existsSync(resolvedPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: resolvedPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      auth = new google.auth.GoogleAuth({
        credentials: FALLBACK_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    }
  }

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Gets sheet metadata and finds the active month block in 'X N' for a given spreadsheet.
 */
export async function getOrInitMonthBlock(spreadsheetId, sheetTitle = 'X N', date = new Date()) {
  const sheets = await getSheetsClient();
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:ZZ2`
  });

  const row1 = res.data.values?.[0] || [];
  const row2 = res.data.values?.[1] || [];

  let monthColIndex = -1;
  let monthName = '';

  for (let c = 2; c < row1.length; c++) {
    if (row1[c] && row1[c].trim()) {
      monthColIndex = c;
      monthName = row1[c].trim();
      break;
    }
  }

  if (monthColIndex === -1) {
    monthColIndex = 2;
    monthName = 'Oktyabr';
  }

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
    monthName,
    monthColIndex,
    categoryMap
  };
}

/**
 * Creates a new month table block on the left (at Column C / index 2).
 */
export async function createNewMonthBlock(spreadsheetId, newMonthName, sheetTitle = 'X N') {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const targetSheet = meta.data.sheets.find(s => s.properties.title === sheetTitle);
  if (!targetSheet) {
    throw new Error(`Sheet "${sheetTitle}" not found`);
  }
  const sheetId = targetSheet.properties.sheetId;

  // Insert 88 columns at Column C (index 2)
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

  const newRow1 = [newMonthName];
  const newRow2 = [];
  for (const cat of CATEGORIES) {
    newRow2.push(cat.label);
    newRow2.push('');
  }
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

  return { success: true, monthName: newMonthName };
}

/**
 * Appends or accumulates an expense item in sheet 'X N' for a specific branch.
 */
export async function appendExpenseByCategory(categoryKeyOrLabel, { expenseTitle, amount, branch = 'uchtepa', date = new Date() }) {
  const branchConfig = BRANCHES[branch] || BRANCHES.uchtepa;
  const spreadsheetId = branchConfig.spreadsheetId;
  const sheetTitle = branchConfig.sheetTitle;

  const sheets = await getSheetsClient();
  const { monthName, categoryMap } = await getOrInitMonthBlock(spreadsheetId, sheetTitle, date);

  const normKey = normalizeName(categoryKeyOrLabel);
  const targetColInfo = categoryMap[normKey] || categoryMap[categoryKeyOrLabel];

  if (!targetColInfo) {
    throw new Error(`Категория "${categoryKeyOrLabel}" не найдена в таблице!`);
  }

  const day = date.getDate();
  const rowIndex = day + 2;

  let sheetAmount = amount;
  if (amount >= 1000) {
    sheetAmount = amount / 1000;
  }

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
    branch: branchConfig.name,
    branchKey: branchConfig.key,
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
