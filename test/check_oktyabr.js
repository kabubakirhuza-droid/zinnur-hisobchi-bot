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
  
  // Read row 1 and row 2 of 'X N'
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'X N'!A1:ZZ2`
  });
  
  const row1 = res.data.values?.[0] || [];
  const row2 = res.data.values?.[1] || [];
  
  console.log('Row 1 non-empty:');
  row1.forEach((val, idx) => {
    if (val && val.trim()) console.log(`Col ${idx}: "${val}"`);
  });
}

main().catch(console.error);
