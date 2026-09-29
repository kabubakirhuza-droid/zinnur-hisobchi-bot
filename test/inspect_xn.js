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
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'X N'!A1:ZZ10`
  });
  
  console.log('Row 1 total columns:', res.data.values[0]?.length);
  console.log('Row 1 values (non-empty):');
  res.data.values[0]?.forEach((val, idx) => {
    if (val && val.trim()) console.log(`Col ${idx} (${indexToCol(idx)}): "${val}"`);
  });
  
  console.log('\nRow 2 values (first 30):');
  res.data.values[1]?.slice(0, 30).forEach((val, idx) => {
    console.log(`Col ${idx} (${indexToCol(idx)}): "${val}"`);
  });
}

function indexToCol(index) {
  let col = '';
  let temp = index;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

main().catch(console.error);
