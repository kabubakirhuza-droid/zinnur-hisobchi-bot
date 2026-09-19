import 'dotenv/config';
import { getTargetSheetTitle, ensureSheetHeaders } from '../src/sheets.js';

async function test() {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  console.log(`Проверка подключения к Google Sheets ID: ${spreadsheetId}...`);

  try {
    const title = await getTargetSheetTitle(spreadsheetId);
    console.log(`✅ Подключение успешно! Имя листа: "${title}"`);

    await ensureSheetHeaders(spreadsheetId, title);
    console.log(`✅ Заголовки проверены и готовы!`);
  } catch (error) {
    console.error(`❌ Ошибка доступа:`, error.message);
  }
}

test();
