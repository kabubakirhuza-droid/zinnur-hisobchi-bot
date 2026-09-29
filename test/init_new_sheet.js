import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import { CATEGORIES, indexToCol } from '../src/sheets.js';

async function setupNewSpreadsheet() {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1pOyuFZkQ4AbjELBK0753uUkgGVJ_UNfMBEGqpK9M6hc';

  console.log('🚀 Initializing new spreadsheet:', spreadsheetId);

  // 1. Rename 'Лист1' to 'X N' and expand columns to 200
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              title: 'X N',
              gridProperties: {
                rowCount: 100,
                columnCount: 150,
                frozenRowCount: 2,
                frozenColumnCount: 2
              }
            },
            fields: 'title,gridProperties'
          }
        }
      ]
    }
  });

  console.log('✅ Sheet renamed to "X N" with 150 columns and frozen panes.');

  // 2. Setup Days in Column A & B (Rows 3..33 for days 1..31)
  const daysValues = [];
  daysValues.push(['', ' ']); // Row 1
  daysValues.push(['', '']);  // Row 2
  for (let d = 1; d <= 31; d++) {
    daysValues.push([String(d), '=0']); // Row 3..33
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'X N'!A1:B33",
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: daysValues }
  });

  // 3. Setup Month Header (Row 1 Col C) and Category Headers (Row 2 Col C..)
  const row1 = ['Oktyabr'];
  const row2 = [];
  for (const cat of CATEGORIES) {
    row2.push(cat.label);
    row2.push(''); // description column
  }
  while (row2.length < 88) row2.push('');

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'X N'!C1:C1",
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row1] }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'X N'!C2:${indexToCol(2 + 87)}2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row2] }
  });

  // 4. Setup Bottom Formulas for Row 38 (=SUM(C3:C36), =SUM(E3:E36)...)
  const formulaRow = [];
  for (let c = 2; c < 2 + 88; c += 2) {
    const colLetter = indexToCol(c);
    formulaRow.push(`=SUM(${colLetter}3:${colLetter}36)`);
    formulaRow.push('');
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'X N'!C38:${indexToCol(2 + 87)}38`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [formulaRow] }
  });

  console.log('🎉 New spreadsheet fully initialized with Oktyabr and all 43 categories!');
}

setupNewSpreadsheet().catch(console.error);
