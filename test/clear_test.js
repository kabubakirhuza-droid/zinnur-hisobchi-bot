import 'dotenv/config';
import { getSheetsClient } from '../src/sheets.js';

async function clearTest() {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE',
    range: "'X N'!Q31:R31"
  });
  console.log('✅ Cleared test row Q31:R31');
}
clearTest().catch(console.error);
