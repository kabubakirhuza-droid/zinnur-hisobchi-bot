import 'dotenv/config';
import { parseExpenseCommand } from '../src/parser.js';
import { getOrInitMonthBlock, CATEGORIES } from '../src/sheets.js';

async function testAll() {
  console.log('=== 1. Testing Parser ===');
  
  const test1 = parseExpenseCommand('/hisob taksi 25000');
  console.log('Test 1 (/hisob taksi 25000):', test1);
  if (!test1.success || test1.amount !== 25000) throw new Error('Test 1 failed');

  const test2 = parseExpenseCommand('/hisob #tushlik 35000 osh');
  console.log('Test 2 (/hisob #tushlik 35000 osh):', test2);
  if (!test2.success || test2.category?.key !== 'tushlik') throw new Error('Test 2 failed');

  const test3 = parseExpenseCommand('/hisob arenda 41527000');
  console.log('Test 3 (/hisob arenda 41527000):', test3);
  if (!test3.success || test3.amount !== 41527000) throw new Error('Test 3 failed');

  console.log('\n=== 2. Testing Sheets Category & Month Structure ===');
  const spreadsheetId = '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE';
  const block = await getOrInitMonthBlock(spreadsheetId, 'X N', new Date());
  console.log('Detected Month:', block.monthName);
  console.log('Month column index:', block.monthColIndex);
  console.log('Total mapped categories:', Object.keys(block.categoryMap).length);
  
  for (const cat of CATEGORIES) {
    const found = block.categoryMap[cat.key];
    if (!found) throw new Error(`Category ${cat.label} (${cat.key}) not found in map!`);
  }

  console.log('🎉 ALL 43 CATEGORIES VALIDATED SUCCESSFULLY!');
}

testAll().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
