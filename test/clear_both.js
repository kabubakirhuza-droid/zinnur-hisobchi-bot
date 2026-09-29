import 'dotenv/config';
import { getSheetsClient, BRANCHES } from '../src/sheets.js';

async function clearBoth() {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: BRANCHES.uchtepa.spreadsheetId,
    range: "'X N'!Q31:R31"
  });
  await sheets.spreadsheets.values.clear({
    spreadsheetId: BRANCHES.sergeli.spreadsheetId,
    range: "'X N'!O31:P31"
  });
  console.log('✅ Cleared test cells from both sheets');
}
clearBoth().catch(console.error);
