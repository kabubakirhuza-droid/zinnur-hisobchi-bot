// =================================================================
// 📊 TELEGRAM EXPENSE BOT ДЛЯ GOOGLE APPS SCRIPT (БЕЗ СЕРВЕРА 24/7)
// =================================================================

const BOT_TOKEN = "8760033475:AAGd1me4GB-F9u2ZZmeBilrQKuOtWU8QYRg";
const ADMIN_ID = "716752890";
const SPREADSHEET_ID = "1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE";

// Колонки категорий согласно структуре Google Sheets:
const CATEGORIES = {
  svet_uchun:     { label: "💡 Svet uchun", col: 1 },  // A, B
  gaz_uchun:      { label: "🔥 Gaz uchun", col: 3 },   // C, D
  ovqat:          { label: "🍲 Ovqat", col: 5 },       // E, F
  kunlik_xarajat: { label: "🛒 Kunlik xarajat", col: 7 }, // G, H
  oylik:          { label: "💵 Oylik", col: 9 },       // I, J
  avans:          { label: "💳 Avans", col: 11 }       // K, L
};

// Проверка работы веб-приложения при открытии в браузере
function doGet(e) {
  return ContentService.createTextOutput("✅ Telegram Expense Bot is Active and Running 24/7!");
}

// =================================================================
// 🌐 WEBHOOK ОБРАБОТЧИК (Вызывается Telegram при каждом действии)
// =================================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("OK");
    }

    const update = JSON.parse(e.postData.contents);

    // 1. Обработка текстового сообщения (/hisob ...)
    if (update.message && update.message.text) {
      handleExpenseMessage(update.message);
    }

    // 2. Обработка нажатия на кнопку выбора категории админом
    if (update.callback_query) {
      handleCategoryCallback(update.callback_query);
    }
  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
  }
  return ContentService.createTextOutput("OK");
}

// =================================================================
// 📩 ОБРАБОТКА КОМАНДЫ /hisob ИЗ ГРУППЫ
// =================================================================
function handleExpenseMessage(msg) {
  const text = msg.text.trim();
  const match = text.match(/^\/hisob(?:@\w+)?(?:\s+(.*))?$/is);
  if (!match || !match[1]) return;

  const payload = match[1].trim().replace(/\s*(?:so['’`]?m|сум|sum|руб|rub|\$|usd)\s*$/i, '');

  let title = "";
  let amount = 0;

  const endMatch = payload.match(/^(.*?)\s+((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s*$/);
  const startMatch = payload.match(/^((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s+(.*?)\s*$/);

  if (endMatch) {
    title = endMatch[1].trim();
    amount = parseFloat(endMatch[2].replace(/\s+/g, '').replace(/,/g, '.'));
  } else if (startMatch) {
    amount = parseFloat(startMatch[1].replace(/\s+/g, '').replace(/,/g, '.'));
    title = startMatch[2].trim();
  } else {
    return;
  }

  if (!title || isNaN(amount) || amount <= 0) return;

  const from = msg.from || {};
  const fullName = ((from.first_name || '') + ' ' + (from.last_name || '')).trim() || from.username || "Foydalanuvchi";
  const username = from.username ? "@" + from.username : "";
  const groupTitle = msg.chat.title || "Lichka";
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const now = new Date();
  const timeStr = Utilities.formatDate(now, "Asia/Tashkent", "dd.MM.yyyy HH:mm");
  const expId = "exp_" + now.getTime() + "_" + Math.floor(Math.random() * 1000);

  // Сохраняем в кэш Google Apps Script
  const data = {
    title: title,
    amount: amount,
    fullName: fullName,
    username: username,
    groupTitle: groupTitle,
    chatId: chatId,
    messageId: messageId,
    timeStr: timeStr
  };
  CacheService.getScriptCache().put(expId, JSON.stringify(data), 21600);

  // Клавиатура с категориями для админа
  const keyboard = {
    inline_keyboard: [
      [
        { text: "💡 Svet uchun", callback_data: "cat:svet_uchun:" + expId },
        { text: "🔥 Gaz uchun", callback_data: "cat:gaz_uchun:" + expId }
      ],
      [
        { text: "🍲 Ovqat", callback_data: "cat:ovqat:" + expId },
        { text: "🛒 Kunlik xarajat", callback_data: "cat:kunlik_xarajat:" + expId }
      ],
      [
        { text: "💵 Oylik", callback_data: "cat:oylik:" + expId },
        { text: "💳 Avans", callback_data: "cat:avans:" + expId }
      ],
      [
        { text: "❌ Bekor qilish", callback_data: "cancel:" + expId }
      ]
    ]
  };

  const adminText =
    "📥 <b>Yangi xarajat keldi!</b>\n\n" +
    "📍 <b>Guruh:</b> " + escapeHtml(groupTitle) + "\n" +
    "👤 <b>Foydalanuvchi:</b> " + escapeHtml(fullName) + (username ? " (" + username + ")" : "") + "\n" +
    "📝 <b>Nomi:</b> <code>" + escapeHtml(title) + "</code>\n" +
    "💰 <b>Summa:</b> <b>" + formatNum(amount) + " so'm</b>\n" +
    "⏰ <b>Vaqti:</b> " + timeStr + "\n\n" +
    "<i>Qaysi kategoriyaga yozilsin? Tanlang:</i> 👇";

  sendTelegram("sendMessage", {
    chat_id: ADMIN_ID,
    text: adminText,
    parse_mode: "HTML",
    reply_markup: JSON.stringify(keyboard)
  });
}

// =================================================================
// 🔘 ОБРАБОТКА НАЖАТИЯ КНОПОК АДМИНОМ
// =================================================================
function handleCategoryCallback(cb) {
  const cbData = cb.data || "";
  const parts = cbData.split(":");
  const action = parts[0];
  const catKey = parts[1];
  const expId = parts[2];

  sendTelegram("answerCallbackQuery", { callback_query_id: cb.id });

  let item = null;
  const cached = CacheService.getScriptCache().get(expId);
  if (cached) {
    item = JSON.parse(cached);
  } else {
    item = parseFromText(cb.message.text);
  }

  if (!item) {
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: "✅ Bu xarajat allaqachon saqlangan yoki bekor qilingan."
    });
    return;
  }

  // Если нажали "Отмена"
  if (action === "cancel") {
    CacheService.getScriptCache().remove(expId);
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: "❌ <b>Xarajat bekor qilindi (saqlanmadi)</b>\n\n📝 <b>Nomi:</b> " + escapeHtml(item.title) + "\n💰 <b>Summa:</b> " + formatNum(item.amount) + " so'm",
      parse_mode: "HTML"
    });

    if (item.chatId && String(item.chatId) !== String(ADMIN_ID)) {
      sendTelegram("sendMessage", {
        chat_id: item.chatId,
        text: "❌ <b>Xarajat rad etildi (saqlanmadi)</b>\n\n📝 <b>Nomi:</b> <code>" + escapeHtml(item.title) + "</code>\n💰 <b>Summa:</b> " + formatNum(item.amount) + " so'm",
        parse_mode: "HTML",
        reply_to_message_id: item.messageId
      });
    }
    return;
  }

  const cat = CATEGORIES[catKey];
  if (!cat) return;

  // 1. Запись в Google Таблицу
  saveToSheet(cat.col, item.title, item.amount);
  CacheService.getScriptCache().remove(expId);

  // 2. Обновление сообщения админу в ЛС
  const successAdmin =
    "✅ <b>Google Sheets-ga muvaffaqiyatli saqlandi!</b>\n\n" +
    "📁 <b>Kategoriya:</b> " + cat.label + "\n" +
    "📝 <b>Nomi:</b> <code>" + escapeHtml(item.title) + "</code>\n" +
    "💰 <b>Summa:</b> <b>" + formatNum(item.amount) + " so'm</b>\n" +
    "👤 <b>Foydalanuvchi:</b> " + escapeHtml(item.fullName) + "\n" +
    "📍 <b>Guruh:</b> " + escapeHtml(item.groupTitle) + "\n" +
    "⏰ <b>Vaqti:</b> " + item.timeStr;

  sendTelegram("editMessageText", {
    chat_id: cb.message.chat.id,
    message_id: cb.message.message_id,
    text: successAdmin,
    parse_mode: "HTML"
  });

  // 3. Отправка подтверждения в группу
  if (item.chatId && String(item.chatId) !== String(ADMIN_ID)) {
    const groupText =
      "✅ <b>Xarajat tasdiqlandi va jadvalga kiritildi!</b>\n\n" +
      "📁 <b>Kategoriya:</b> " + cat.label + "\n" +
      "📝 <b>Nomi:</b> <code>" + escapeHtml(item.title) + "</code>\n" +
      "💰 <b>Summa:</b> <b>" + formatNum(item.amount) + " so'm</b>\n" +
      "👤 <b>Kiritgan:</b> " + escapeHtml(item.fullName) + "\n" +
      "👨‍💼 <b>Tasdiqladi:</b> Administrator";

    sendTelegram("sendMessage", {
      chat_id: item.chatId,
      text: groupText,
      parse_mode: "HTML",
      reply_to_message_id: item.messageId
    });
  }
}

// =================================================================
// 📊 ЗАПИСЬ В GOOGLE ТАБЛИЦУ (В нужные колонки со строки 3)
// =================================================================
function saveToSheet(startCol, title, amount) {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const sheet = ss.getSheets()[0];
  const values = sheet.getRange(3, startCol, 1000, 2).getValues();

  let targetRow = 3 + values.length;
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0] && !values[i][1]) {
      targetRow = 3 + i;
      break;
    }
  }

  sheet.getRange(targetRow, startCol, 1, 2).setValues([[title, amount]]);
}

// =================================================================
// 🛠 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =================================================================
function formatNum(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseFromText(txt) {
  if (!txt) return null;
  const nameM = txt.match(/Nomi:\s*([^\n]+)/i);
  const sumM = txt.match(/Summa:\s*([\d\s\.,]+)/i);
  const grpM = txt.match(/Guruh:\s*([^\n]+)/i);
  const usrM = txt.match(/Foydalanuvchi:\s*([^\n]+)/i);
  const timM = txt.match(/Vaqti:\s*([^\n]+)/i);
  if (nameM && sumM) {
    const amt = parseFloat(sumM[1].replace(/[^\d\.,]/g, '').replace(/,/g, '.'));
    return {
      title: nameM[1].trim(),
      amount: amt,
      groupTitle: grpM ? grpM[1].trim() : "Guruh",
      fullName: usrM ? usrM[1].trim() : "Foydalanuvchi",
      timeStr: timM ? timM[1].trim() : ""
    };
  }
  return null;
}

function sendTelegram(method, payload) {
  const url = "https://api.telegram.org/bot" + BOT_TOKEN + "/" + method;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  return UrlFetchApp.fetch(url, options);
}
