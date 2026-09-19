import { parseExpenseCommand } from '../src/parser.js';

const testCases = [
  { input: '/hisob такси 20000', expected: { title: 'такси', amount: 20000 } },
  { input: '/hisob обед 50000', expected: { title: 'обед', amount: 50000 } },
  { input: '/hisob бензин 100000', expected: { title: 'бензин', amount: 100000 } },
  { input: '/hisob продукты 250000', expected: { title: 'продукты', amount: 250000 } },
  { input: '/hisob такси 20 000', expected: { title: 'такси', amount: 20000 } },
  { input: '/hisob обед в кафе 150 000 сум', expected: { title: 'обед в кафе', amount: 150000 } },
  { input: '/hisob@expense_bot кофе 35 000', expected: { title: 'кофе', amount: 35000 } },
  { input: '/hisob продукты 1250.50', expected: { title: 'продукты', amount: 1250.5 } },
  { input: '/hisob продукты 1250,50', expected: { title: 'продукты', amount: 1250.5 } },
  { input: '/hisob 50000 обед', expected: { title: 'обед', amount: 50000 } },
];

console.log('🧪 Тестирование парсера расходов:\n');
let passed = 0;

for (const { input, expected } of testCases) {
  const result = parseExpenseCommand(input);
  if (result.success && result.title === expected.title && result.amount === expected.amount) {
    console.log(`✅ [PASS] "${input}" -> Title: "${result.title}", Amount: ${result.amount}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] "${input}" -> Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(result)}`);
  }
}

console.log(`\nРезультат: ${passed}/${testCases.length} тестов пройдено успешно.`);
if (passed !== testCases.length) {
  process.exit(1);
}
