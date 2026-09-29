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
    range: `'X N'!A1:CM10`
  });
  
  const rows = res.data.values || [];
  console.log('Row 1 (Month headers):', rows[0]?.filter(Boolean));
  console.log('Row 2 (Category headers in Oktyabr):');
  for (let c = 2; c < 90; c += 2) {
    const catName = rows[1]?.[c];
    const subCol1 = rows[2]?.[c] || '';
    const subCol2 = rows[2]?.[c + 1] || '';
    console.log(`Col ${c} (${indexToCol(c)}) & ${c+1} (${indexToCol(c+1)}): "${catName}" -> Subheaders: [${subCol1}, ${subCol2}]`);
  }
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
