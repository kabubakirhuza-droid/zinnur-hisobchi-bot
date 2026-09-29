import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';

async function main() {
  const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE';
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  console.log('Sheets found:', meta.data.sheets.map(s => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
    gridProperties: s.properties.gridProperties
  })));

  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${title}'!A1:ZZ5`
    });
    console.log(`\n=== SHEET: ${title} ===`);
    if (res.data.values) {
      console.log('Row 1 (first 20 cols):', res.data.values[0]?.slice(0, 20));
      console.log('Row 2 (first 20 cols):', res.data.values[1]?.slice(0, 20));
      console.log('Total cols in row 1:', res.data.values[0]?.length);
    } else {
      console.log('Empty sheet');
    }
  }
}

main().catch(console.error);
