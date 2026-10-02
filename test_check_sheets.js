import { getSheetsClient, BRANCHES } from './src/sheets.js';

async function main() {
  const sheets = await getSheetsClient();
  
  const testSheets = [
    { name: 'Uchtepa (Current Config)', id: BRANCHES.uchtepa.spreadsheetId },
    { name: 'Sergeli (Current Config)', id: BRANCHES.sergeli.spreadsheetId },
    { name: 'Uchtepa (Old ID)', id: '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE' }
  ];

  for (const s of testSheets) {
    console.log(`\n========================================`);
    console.log(`Checking: ${s.name} (${s.id})`);
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: s.id,
        range: "'X N'!A1:ZZ35"
      });
      const rows = res.data.values || [];
      console.log(`Total rows: ${rows.length}`);
      if (rows.length > 0) {
        console.log(`Row 1:`, rows[0].slice(0, 10));
        console.log(`Row 2:`, rows[1]?.slice(0, 10));
        console.log(`Row 4 (Day 2):`, rows[3]?.slice(0, 10));
      }

      let found = false;
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < (rows[r] || []).length; c++) {
          const val = String(rows[r][c] || '');
          if (val === '58' || val.includes('58')) {
            console.log(`>>> FOUND 58 at Row ${r + 1} (Day ${r - 1}), Col ${c + 1} (${rows[1]?.[c] || 'Col ' + c}): val = "${val}"`);
            found = true;
          }
        }
      }
      if (!found) console.log(`No 58 found in this sheet.`);
    } catch (e) {
      console.error(`Error reading ${s.name}:`, e.message);
    }
  }
}

main();
