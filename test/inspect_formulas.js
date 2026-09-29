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
  
  // Check formulas in Oktyabr and Sentyabr
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'X N'!A34:CL40`,
    valueRenderOption: 'FORMULA'
  });
  
  console.log('Bottom summary formulas (Rows 34-40) in Oktyabr:');
  res.data.values?.forEach((r, i) => {
    console.log(`Row ${i+34}:`, r.slice(0, 15));
  });
}

main().catch(console.error);
