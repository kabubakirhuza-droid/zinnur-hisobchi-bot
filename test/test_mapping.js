import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

export const CATEGORIES_LIST = [
  { key: 'ustozlar_av', label: 'Ustozlar av.', group: 'Xodimlar' },
  { key: 'ustozlar_bonus', label: 'Ustozlar bonus', group: 'Xodimlar' },
  { key: 'oquv_bolimi', label: "O'quv bo'limi", group: 'Xodimlar' },
  { key: 'oquv_bolimi_bonus', label: "O'quv bo'limi bonus", group: 'Xodimlar' },
  { key: 'farroshlar_oklad', label: 'Farroshlar oklad', group: 'Xodimlar' },
  { key: 'farroshlar_bonus', label: 'Farroshlar bonus', group: 'Xodimlar' },
  { key: 'pechat_av', label: 'pechat Av.', group: 'Xodimlar' },
  { key: 'admin_av', label: 'Admin AV.', group: 'Xodimlar' },
  { key: 'admin_bonus', label: 'Admin bonus', group: 'Xodimlar' },
  { key: 'taminot', label: "Ta'minot", group: 'Xodimlar' },
  { key: 'taminot_kpi', label: "Ta'minot KPI", group: 'Xodimlar' },
  { key: 'fin_otdel', label: 'Fin otdel', group: 'Xodimlar' },
  { key: 'coo', label: 'COO', group: 'Xodimlar' },
  { key: 'n_av', label: 'N. av', group: 'Xodimlar' },
  { key: 'yurist', label: 'Yurist', group: 'Xodimlar' },
  { key: 'hr_oylik', label: 'HR oylik', group: 'Xodimlar' },
  { key: 'hr_xarajat', label: 'HR xarajat', group: 'Xodimlar' },
  { key: 'sotuv_konsultant', label: 'Sotuv konsultant', group: 'Xodimlar' },
  { key: 'sotuv_av', label: 'Sotuv av.', group: 'Xodimlar' },

  { key: 'tushlik', label: 'Tushlik', group: 'Ofis' },
  { key: 'mini_taom', label: 'Mini taom', group: 'Ofis' },
  { key: 'arenda', label: 'Arenda', group: 'Ofis' },
  { key: 'mini_obsh', label: 'Mini obsh.', group: 'Ofis' },
  { key: 'gigiyena_va_stakan', label: 'Gigiyena va stakan', group: 'Ofis' },
  { key: 'kommunal', label: 'Kommunal', group: 'Ofis' },
  { key: 'umumiy', label: 'Umumiy', group: 'Ofis' },
  { key: 'obw_1_marotalik', label: 'Obw 1 marotalik', group: 'Ofis' },
  { key: 'pechat', label: 'Pechat', group: 'Ofis' },
  { key: 'programma', label: 'Programma', group: 'Ofis' },
  { key: 'remont', label: 'Remont', group: 'Ofis' },
  { key: 'org_tex', label: 'org. Tex', group: 'Ofis' },

  { key: 'marketing_okl', label: 'Marketing + okl', group: 'Marketing' },
  { key: 'marketing_kpi', label: 'Marketing KPI', group: 'Marketing' },
  { key: 'target', label: 'Target', group: 'Marketing' },
  { key: 'savdo_bonus', label: 'Savdo bonus', group: 'Marketing' },
  { key: 'marketing_harajat', label: 'marketing harajat', group: 'Marketing' },
  { key: 'oqish_motivya', label: "O'qish motiv-ya", group: 'Marketing' },
  { key: 'sotish_uchun', label: 'Sotish uchun', group: 'Marketing' },

  { key: 'sergeliga_qarz', label: 'Sergeliga qarz', group: 'Boshqa' },
  { key: 'onlinega_qarz', label: 'Onlinega qarz', group: 'Boshqa' },
  { key: 'kutilmagan_xarajat', label: 'Kutilmagan xarajat', group: 'Boshqa' },
  { key: 'obmen', label: 'Obmen', group: 'Boshqa' },
  { key: 'pul_qaytarish', label: 'Pul qaytarish', group: 'Boshqa' }
];

export function indexToCol(index) {
  let col = '';
  let temp = index;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

export function normalizeCategoryName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['`’‘]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function testSheetIntegration() {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE';
  
  // 1. Read top 2 rows of 'X N'
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'X N'!A1:ZZ2`
  });
  
  const row1 = res.data.values?.[0] || [];
  const row2 = res.data.values?.[1] || [];
  
  console.log('Detected total columns in X N:', row2.length);
  
  // Find current month
  const now = new Date();
  const currentMonthUz = UZ_MONTHS[now.getMonth()];
  console.log('Current Uzbek Month:', currentMonthUz, 'Day:', now.getDate());
  
  // Find column index of current month in row 1
  let monthColIndex = -1;
  for (let c = 0; c < row1.length; c++) {
    if (row1[c] && normalizeCategoryName(row1[c]) === normalizeCategoryName(currentMonthUz)) {
      monthColIndex = c;
      break;
    }
  }
  
  console.log(`Month "${currentMonthUz}" found at column index: ${monthColIndex} (${indexToCol(monthColIndex)})`);
  
  // Map all categories in this month block
  const categoryMap = {};
  for (let c = monthColIndex; c < monthColIndex + 90 && c < row2.length; c += 2) {
    const header = row2[c];
    if (header && header.trim()) {
      categoryMap[normalizeCategoryName(header)] = {
        colIndex: c,
        sumCol: indexToCol(c),
        descCol: indexToCol(c + 1),
        header: header.trim()
      };
    }
  }
  
  console.log('Matched categories count:', Object.keys(categoryMap).length);
  
  // Check matching with CATEGORIES_LIST
  let matched = 0;
  for (const cat of CATEGORIES_LIST) {
    const found = categoryMap[normalizeCategoryName(cat.label)];
    if (found) {
      matched++;
    } else {
      console.warn('NOT MATCHED:', cat.label, 'normalized:', normalizeCategoryName(cat.label));
    }
  }
  console.log(`Matched ${matched} / ${CATEGORIES_LIST.length} categories!`);
}

testSheetIntegration().catch(console.error);
