// =================================================================
// 🌟 ZIN-NUR XISOBCHI BOT — GOOGLE APPS SCRIPT (BUTUNLAY SERVERSIZ 24/7)
// =================================================================
// Ushbu skript Google Sheets ichida ishlaydi. Hech qanday kompyuter yoki
// tashqi server kerak emas! 100% Google serverlarida 24/7/365 bepul ishlaydi.
// =================================================================

const BOT_TOKEN = "8760033475:AAGd1me4GB-F9u2ZZmeBilrQKuOtWU8QYRg";
const ADMIN_ID = "716752890"; // Yagona bosh administrator

// Filiallar va jadvallar
const BRANCHES = {
  uchtepa: {
    key: "uchtepa",
    name: "🏢 Uchtepa",
    spreadsheetId: "1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE",
    sheetTitle: "X N"
  },
  sergeli: {
    key: "sergeli",
    name: "🏬 Sergeli",
    spreadsheetId: "1uYxa1MNQxx0cmvScS69JpBtrnSpkVkrkpsG_nF9x6Mc",
    sheetTitle: "X N"
  }
};

const CATEGORIES = [
  // Xodimlar
  { key: "ustozlar_av", label: "Ustozlar av.", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "ustozlar_bonus", label: "Ustozlar bonus", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "oquv_bolimi", label: "O'quv bo'limi", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "oquv_bolimi_bonus", label: "O'quv bo'limi bonus", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "farroshlar_oklad", label: "Farroshlar oklad", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "farroshlar_bonus", label: "Farroshlar bonus", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "pechat_av", label: "pechat Av.", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "admin_av", label: "Admin AV.", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "admin_bonus", label: "Admin bonus", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "taminot", label: "Ta'minot", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "taminot_kpi", label: "Ta'minot KPI", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "fin_otdel", label: "Fin otdel", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "coo", label: "COO", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "n_av", label: "N. av", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "yurist", label: "Yurist", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "hr_oylik", label: "HR oylik", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "hr_xarajat", label: "HR xarajat", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "sotuv_konsultant", label: "Sotuv konsultant", group: "xodimlar", groupName: "👥 Xodimlar" },
  { key: "sotuv_av", label: "Sotuv av.", group: "xodimlar", groupName: "👥 Xodimlar" },

  // Ofis & Xo'jalik
  { key: "tushlik", label: "Tushlik", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "mini_taom", label: "Mini taom", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "arenda", label: "Arenda", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "mini_obsh", label: "Mini obsh.", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "gigiyena_va_stakan", label: "Gigiyena va stakan", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "kommunal", label: "Kommunal", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "umumiy", label: "Umumiy", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "obw_1_marotalik", label: "Obw 1 marotalik", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "pechat", label: "Pechat", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "programma", label: "Programma", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "remont", label: "Remont", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },
  { key: "org_tex", label: "org. Tex", group: "ofis", groupName: "🏢 Ofis & Xo‘jalik" },

  // Marketing & Sotuv
  { key: "marketing_okl", label: "Marketing + okl", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "marketing_kpi", label: "Marketing KPI", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "target", label: "Target", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "savdo_bonus", label: "Savdo bonus", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "marketing_harajat", label: "marketing harajat", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "oqish_motivya", label: "O'qish motiv-ya", group: "marketing", groupName: "📢 Marketing & Savdo" },
  { key: "sotish_uchun", label: "Sotish uchun", group: "marketing", groupName: "📢 Marketing & Savdo" },

  // Boshqa & Qarz
  { key: "sergeliga_qarz", label: "Sergeliga qarz", group: "boshqa", groupName: "🔄 Qarz & Boshqa" },
  { key: "onlinega_qarz", label: "Onlinega qarz", group: "boshqa", groupName: "🔄 Qarz & Boshqa" },
  { key: "kutilmagan_xarajat", label: "Kutilmagan xarajat", group: "boshqa", groupName: "🔄 Qarz & Boshqa" },
  { key: "obmen", label: "Obmen", group: "boshqa", groupName: "🔄 Qarz & Boshqa" },
  { key: "pul_qaytarish", label: "Pul qaytarish", group: "boshqa", groupName: "🔄 Qarz & Boshqa" }
];

const GROUPS = [
  { key: "xodimlar", label: "👥 Xodimlar (19)" },
  { key: "ofis", label: "🏢 Ofis & Xo‘jalik (11)" },
  { key: "marketing", label: "📢 Marketing (7)" },
  { key: "boshqa", label: "🔄 Qarz & Boshqa (5)" }
];

// Tekshirish uchun Get
function doGet(e) {
  return ContentService.createTextOutput("✅ Zinnur Hisobchi Bot (Google Apps Script) ishlamoqda!");
}

// Webhook orqali Telegramdan keladigan xabarlarni qabul qilish
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("OK");
    }

    const update = JSON.parse(e.postData.contents);

    // 1. Matnli xabar
    if (update.message && update.message.text) {
      handleIncomingMessage(update.message);
    }

    // 2. Tugma bosilishi (Callback query)
    if (update.callback_query) {
      handleCallback(update.callback_query);
    }
  } catch (err) {
    Logger.log("doPost error: " + err.toString());
  }
  return ContentService.createTextOutput("OK");
}

function handleIncomingMessage(msg) {
  const text = msg.text.trim();
  const chatTitle = msg.chat.title || "";
  const chatId = msg.chat.id;

  if (text.startsWith("/start")) {
    const fromId = String(msg.from.id);
    let startMsg = "Assalomu alaykum! Men <b>ZIN-NUR Xisobchi Boti</b>man.\n\n";
    startMsg += "📝 Xarajat kiritish:\n";
    startMsg += "• <code>/hisob uchtepa taksi 25000</code>\n";
    startMsg += "• <code>/hisob sergeli taksi 25000</code>\n";
    startMsg += "• <code>/hisob sergeli #tushlik 35000 osh</code>\n\n";
    if (fromId === ADMIN_ID) {
      startMsg += "👑 <b>Siz Administrator sifatida tizimdasiz!</b>";
    }
    sendTelegram("sendMessage", { chat_id: chatId, text: startMsg, parse_mode: "HTML" });
    return;
  }

  const match = text.match(/^\/(?:hisob|xarajat)(?:@\w+)?(?:\s+(.*))?$/is);
  if (!match || !match[1]) return;

  let payload = match[1].trim();

  // 1. Filialni aniqlash
  let branch = "uchtepa";
  if (/\b(?:sergeli|сергели|#sergeli)\b/i.test(payload) || /sergeli/i.test(chatTitle)) {
    branch = "sergeli";
    payload = payload.replace(/\b(?:sergeli|сергели|#sergeli)\b/gi, "").trim();
  } else if (/\b(?:uchtepa|учтепа|#uchtepa)\b/i.test(payload) || /uchtepa/i.test(chatTitle)) {
    branch = "uchtepa";
    payload = payload.replace(/\b(?:uchtepa|учтепа|#uchtepa)\b/gi, "").trim();
  }

  // 2. Tegni aniqlash
  let suggestedCat = null;
  const hashM = payload.match(/#([\w\u0400-\u04FF_'-]+)/i);
  if (hashM) {
    const rawTag = hashM[1].toLowerCase().replace(/[^a-z0-9]/g, "");
    suggestedCat = CATEGORIES.find(c => c.key.replace(/[^a-z0-9]/g, "") === rawTag || c.label.toLowerCase().replace(/[^a-z0-9]/g, "") === rawTag);
    payload = payload.replace(hashM[0], "").trim();
  }

  // 3. Summa va nomini ajratish
  payload = payload.replace(/\s*(?:so['’`]?m|сум|sum|руб|rub|\$|usd)\s*$/i, "").trim();
  let title = "";
  let amount = 0;

  const endMatch = payload.match(/^(.*?)\s+((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s*$/);
  const startMatch = payload.match(/^((?:\d{1,3}(?:[\s\.]\d{3})*(?:,\d+)?|\d+(?:[,\.]\d+)?))\s+(.*?)\s*$/);

  if (endMatch) {
    title = endMatch[1].trim();
    amount = parseFloat(endMatch[2].replace(/\s+/g, "").replace(/,/g, "."));
  } else if (startMatch) {
    amount = parseFloat(startMatch[1].replace(/\s+/g, "").replace(/,/g, "."));
    title = startMatch[2].trim();
  } else {
    return;
  }

  if (!title || isNaN(amount) || amount <= 0) return;

  const from = msg.from || {};
  const userName = ((from.first_name || "") + " " + (from.last_name || "")).trim() || from.username || "Noma'lum";
  const userHandle = from.username ? "@" + from.username : userName;
  const expId = "exp_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);

  const expData = {
    expId: expId,
    title: title,
    amount: amount,
    branch: branch,
    userName: userName,
    userHandle: userHandle,
    chatTitle: chatTitle || "Lichka"
  };

  CacheService.getScriptCache().put(expId, JSON.stringify(expData), 21600);

  // Guruhda qisqa tasdiq
  if (msg.chat.type !== "private") {
    sendTelegram("sendMessage", {
      chat_id: chatId,
      text: "📩 <i>Xarajat arizasi (" + BRANCHES[branch].name + ") qabul qilindi.</i>",
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id
    });
  }

  // Adminga kartochka
  const keyboard = buildMainKeyboard(expId, suggestedCat, branch);
  const adminText =
    "🔔 <b>Yangi xarajat arizasi!</b>\n\n" +
    "📍 <b>Filial:</b> <b>" + BRANCHES[branch].name + "</b>\n" +
    "👤 <b>Yuboruvchi:</b> " + userName + " (" + userHandle + ")\n" +
    "📝 <b>Nomi:</b> <code>" + title + "</code>\n" +
    "💵 <b>Summa:</b> <b>" + formatAmountDisplay(amount) + "</b>\n\n" +
    "👇 <b>Qaysi bo‘limga yozilsin?</b>";

  sendTelegram("sendMessage", {
    chat_id: ADMIN_ID,
    text: adminText,
    parse_mode: "HTML",
    reply_markup: JSON.stringify(keyboard)
  });
}

function handleCallback(cb) {
  const data = cb.data || "";
  sendTelegram("answerCallbackQuery", { callback_query_id: cb.id });

  if (data === "noop") return;

  const parts = data.split("_");
  const action = parts[0];
  const expId = parts[1];

  const cached = CacheService.getScriptCache().get(expId);
  if (!cached) {
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: "⚠️ Bu ariza allaqachon ko‘rib chiqilgan yoki eskirgan."
    });
    return;
  }
  const expData = JSON.parse(cached);

  if (action === "cancel") {
    CacheService.getScriptCache().remove(expId);
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: "❌ <b>Xarajat arizasi bekor qilindi.</b>\n\n📝 " + expData.title + " (" + formatAmountDisplay(expData.amount) + ")",
      parse_mode: "HTML"
    });
    return;
  }

  if (action === "swbranch") {
    const newBranch = parts[2];
    expData.branch = newBranch;
    CacheService.getScriptCache().put(expId, JSON.stringify(expData), 21600);
    const keyboard = buildMainKeyboard(expId, null, newBranch);
    const text =
      "🔔 <b>Xarajat arizasi (" + BRANCHES[newBranch].name + ")</b>\n\n" +
      "📍 <b>Filial:</b> <b>" + BRANCHES[newBranch].name + "</b>\n" +
      "👤 <b>Yuboruvchi:</b> " + expData.userName + "\n" +
      "📝 <b>Nomi:</b> <code>" + expData.title + "</code>\n" +
      "💵 <b>Summa:</b> <b>" + formatAmountDisplay(expData.amount) + "</b>\n\n" +
      "👇 Kerakli bo‘limni tanlang:";
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    });
    return;
  }

  if (action === "grp") {
    const grpKey = parts[2];
    const keyboard = buildGroupKeyboard(expId, grpKey);
    const grpInfo = GROUPS.find(g => g.key === grpKey);
    const text =
      "📂 <b>" + (grpInfo ? grpInfo.label : grpKey) + "</b> (" + BRANCHES[expData.branch].name + "):\n\n" +
      "📝 <b>Nomi:</b> <code>" + expData.title + "</code>\n" +
      "💵 <b>Summa:</b> <b>" + formatAmountDisplay(expData.amount) + "</b>\n\n" +
      "Kategoriyani tanlang:";
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    });
    return;
  }

  if (action === "back") {
    const keyboard = buildMainKeyboard(expId, null, expData.branch);
    const text =
      "🔔 <b>Xarajat arizasi (" + BRANCHES[expData.branch].name + ")</b>\n\n" +
      "📍 <b>Filial:</b> <b>" + BRANCHES[expData.branch].name + "</b>\n" +
      "👤 <b>Yuboruvchi:</b> " + expData.userName + "\n" +
      "📝 <b>Nomi:</b> <code>" + expData.title + "</code>\n" +
      "💵 <b>Summa:</b> <b>" + formatAmountDisplay(expData.amount) + "</b>\n\n" +
      "👇 Kerakli bo‘limni tanlang:";
    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    });
    return;
  }

  if (action === "cat") {
    const catKey = parts[2];
    const cat = CATEGORIES.find(c => c.key === catKey);
    if (!cat) return;

    // Saqlash
    const res = saveToBranchSheet(expData.branch, catKey, expData.title, expData.amount);
    CacheService.getScriptCache().remove(expId);

    const successText =
      "✅ <b>Google Jadvalga muvaffaqiyatli saqlandi!</b>\n\n" +
      "📍 <b>Filial:</b> <b>" + BRANCHES[expData.branch].name + "</b>\n" +
      "📊 <b>Kategoriya:</b> <code>" + cat.label + "</code>\n" +
      "📝 <b>Nomi:</b> " + expData.title + "\n" +
      "💵 <b>Yozilgan summa:</b> " + res.addedAmount + " ming (" + formatAmountDisplay(expData.amount) + ")\n" +
      "📅 <b>Oy va kun:</b> " + res.month + ", " + res.day + "-kun (Qator: " + res.row + ")\n" +
      "👤 <b>Yuboruvchi:</b> " + expData.userName;

    sendTelegram("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: successText,
      parse_mode: "HTML"
    });
  }
}

function saveToBranchSheet(branchKey, catKey, title, amount) {
  const branch = BRANCHES[branchKey] || BRANCHES.uchtepa;
  const ss = SpreadsheetApp.openById(branch.spreadsheetId);
  const sheet = ss.getSheetByName(branch.sheetTitle) || ss.getSheets()[0];

  const catIdx = CATEGORIES.findIndex(c => c.key === catKey);
  const sumCol = 3 + (catIdx * 2); // Col C dan boshlanadi
  const descCol = sumCol + 1;

  const now = new Date();
  const day = now.getDate();
  const row = day + 2;

  let sheetAmount = amount;
  if (amount >= 1000) sheetAmount = amount / 1000;

  const currentSumVal = sheet.getRange(row, sumCol).getValue();
  const currentDescVal = sheet.getRange(row, descCol).getValue();

  let finalSum = sheetAmount;
  let finalDesc = title;

  if (currentSumVal && !isNaN(Number(currentSumVal))) {
    finalSum = Number(currentSumVal) + sheetAmount;
    finalDesc = (currentDescVal ? currentDescVal + ", " : "") + title + " " + sheetAmount;
  }

  sheet.getRange(row, sumCol).setValue(finalSum);
  sheet.getRange(row, descCol).setValue(finalDesc);

  return {
    month: "Oktyabr",
    day: day,
    row: row,
    addedAmount: sheetAmount
  };
}

function buildMainKeyboard(expId, suggestedCat, branch) {
  const buttons = [];
  if (suggestedCat) {
    buttons.push([{ text: "✅ " + suggestedCat.label + "-ga saqlash", callback_data: "cat_" + expId + "_" + suggestedCat.key }]);
  }
  const other = branch === "uchtepa" ? "sergeli" : "uchtepa";
  const otherName = branch === "uchtepa" ? "🏬 Sergeliga o‘tkazish" : "🏢 Uchtepaga o‘tkazish";
  buttons.push([
    { text: "📍 Filial: " + BRANCHES[branch].name, callback_data: "noop" },
    { text: otherName, callback_data: "swbranch_" + expId + "_" + other }
  ]);
  buttons.push([
    { text: "👥 Xodimlar (19)", callback_data: "grp_" + expId + "_xodimlar" },
    { text: "🏢 Ofis & Xo‘jalik (11)", callback_data: "grp_" + expId + "_ofis" }
  ]);
  buttons.push([
    { text: "📢 Marketing (7)", callback_data: "grp_" + expId + "_marketing" },
    { text: "🔄 Qarz & Boshqa (5)", callback_data: "grp_" + expId + "_boshqa" }
  ]);
  buttons.push([{ text: "❌ Bekor qilish", callback_data: "cancel_" + expId }]);
  return { inline_keyboard: buttons };
}

function buildGroupKeyboard(expId, grpKey) {
  const list = CATEGORIES.filter(c => c.group === grpKey);
  const buttons = [];
  for (let i = 0; i < list.length; i += 2) {
    const row = [{ text: list[i].label, callback_data: "cat_" + expId + "_" + list[i].key }];
    if (i + 1 < list.length) {
      row.push({ text: list[i + 1].label, callback_data: "cat_" + expId + "_" + list[i + 1].key });
    }
    buttons.push(row);
  }
  buttons.push([
    { text: "⬅️ Boshqa bo‘limlar", callback_data: "back_" + expId },
    { text: "❌ Bekor qilish", callback_data: "cancel_" + expId }
  ]);
  return { inline_keyboard: buttons };
}

function formatAmountDisplay(num) {
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (num >= 1000) {
    const thousands = (num / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm (" + thousands + " ming)";
  }
  return formatted + " ming so'm";
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

// =================================================================
// 🔗 1 BOSISHDA TELEGRAM WEBHOOKNI GOOGLE APPS SCRIPTGA ULASH:
// =================================================================
// 1. Deploy -> New Deployment -> Web App -> Anyone (Barcha uchun) -> Deploy.
// 2. Web App URL manzilini nusxalang va quyidagi qatorga qo'ying:
// 3. Ushbu 'setTelegramWebhook' funksiyasini 1 marta 'Run' qiling!
function setTelegramWebhook() {
  const webAppUrl = "SIZNING_WEB_APP_URL_MANZILINGIZ";
  const res = sendTelegram("setWebhook", { url: webAppUrl });
  Logger.log(res.getContentText());
}
