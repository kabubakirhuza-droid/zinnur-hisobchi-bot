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
    range: `'X N'!CM1:DE35`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });
  
  console.log('Unformatted sample values in Sentyabr:');
  res.data.values?.forEach((r, i) => {
    if (r.some(Boolean)) console.log(`Row ${i+1}:`, r.filter(Boolean));
  });
}

main().catch(console.error);
