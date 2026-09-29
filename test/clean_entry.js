import 'dotenv/config';
import { getSheetsClient, BRANCHES } from '../src/sheets.js';

async function cleanOldEntry() {
  const sheets = await getSheetsClient();
  // Clear row 31 in Uchtepa AE:AF
  await sheets.spreadsheets.values.clear({
    spreadsheetId: BRANCHES.uchtepa.spreadsheetId,
    range: "'X N'!AE31:AF31"
  });
  console.log('✅ Cleared AE31:AF31 in Uchtepa');
}
cleanOldEntry().catch(console.error);
