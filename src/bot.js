import 'dotenv/config';
import http from 'http';
import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { parseExpenseCommand } from './parser.js';
import { appendExpenseByCategory, CATEGORIES } from './sheets.js';

// Lightweight HTTP server for Render.com Web Service health check
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Telegram Expense Bot is running 24/7 on Render!');
});
server.listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID || '716752890';

if (!botToken || botToken === 'your_telegram_bot_token_here') {
  console.error('[CRITICAL] BOT_TOKEN не указан в файле .env!');
  process.exit(1);
}

const bot = new Telegraf(botToken);
const timeZone = process.env.TIMEZONE || 'Asia/Tashkent';

// Persistent storage file for pending expenses across bot restarts
const DB_FILE = path.resolve(process.cwd(), 'pending_expenses.json');

function loadPendingExpenses() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch (err) {
    console.warn('[DB WARNING] Failed to load pending expenses:', err.message);
  }
  return new Map();
}

function savePendingExpenses(map) {
  try {
    const obj = Object.fromEntries(map);
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB ERROR] Failed to save pending expenses:', err.message);
  }
}

const pendingExpenses = loadPendingExpenses();
const processingSet = new Set();

/**
 * Formats current date and time according to the configured timezone.
 * @returns {{ date: string, time: string }}
 */
function getFormattedDateTime() {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    date: dateFormatter.format(now),
    time: timeFormatter.format(now)
  };
}

/**
 * Builds the inline keyboard for selecting expense category.
 * @param {string} expenseId
 */
function buildCategoryKeyboard(expenseId) {
  const buttons = Object.values(CATEGORIES).map((cat) =>
    Markup.button.callback(cat.label, `cat:${cat.key}:${expenseId}`)
  );

  // Layout buttons in 2 columns
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  // Add Cancel button
  rows.push([Markup.button.callback('❌ Bekor qilish', `cancel:${expenseId}`)]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Formats numbers with spaces for readability (e.g. 20000 -> 20 000).
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Fallback parser directly from message text if memory state is not found.
 */
function extractExpenseFromMessageText(msgText) {
  if (!msgText || typeof msgText !== 'string') return null;
  if (msgText.includes('Google Sheets-ga muvaffaqiyatli saqlandi') || msgText.includes('Xarajat bekor qilindi')) {
    return null;
  }

  const groupMatch = msgText.match(/Guruh:\s*([^\n]+)/i);
  const userMatch = msgText.match(/Foydalanuvchi:\s*([^\n]+)/i);
  const nameMatch = msgText.match(/Nomi:\s*([^\n]+)/i);
  const amountMatch = msgText.match(/Summa:\s*([\d\s\.,]+)/i);
  const timeMatch = msgText.match(/Vaqti:\s*([^\n]+)/i);

  if (nameMatch && amountMatch) {
    const rawAmt = amountMatch[1].replace(/[^\d\.,]/g, '').replace(/,/g, '.');
    const amount = parseFloat(rawAmt);
    if (!isNaN(amount) && amount > 0) {
      return {
        groupTitle: groupMatch ? groupMatch[1].trim() : 'Guruh',
        userName: userMatch ? userMatch[1].trim() : 'Foydalanuvchi',
        userUsername: '',
        expenseTitle: nameMatch[1].trim(),
        amount: amount,
        date: timeMatch ? timeMatch[1].split(' ')[0] : '',
        time: timeMatch ? timeMatch[1].split(' ')[1] || '' : ''
      };
    }
  }
  return null;
}

/**
 * Handles incoming /hisob messages.
 */
async function handleExpenseMessage(ctx) {
  const text = ctx.message?.text;
  if (!text) return;

  // 1. Parse command and payload
  const parsed = parseExpenseCommand(text);
  if (!parsed.success) {
    console.warn(`[PARSER WARNING] Пропущено некорректное сообщение: "${text}". Причина: ${parsed.error}`);
    return;
  }

  // 2. Extract user and chat info
  const from = ctx.from || {};
  const chat = ctx.chat || {};

  const firstName = from.first_name || '';
  const lastName = from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || from.username || `User_${from.id}`;
  const username = from.username ? `@${from.username}` : 'Mavjud emas';

  let groupTitle = 'Личные сообщения';
  if (chat.type === 'group' || chat.type === 'supergroup') {
    groupTitle = chat.title || `Группа ${chat.id}`;
  } else if (chat.type === 'channel') {
    groupTitle = chat.title || `Канал ${chat.id}`;
  }

  const { date, time } = getFormattedDateTime();
  const expenseId = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Save to persistent pending store
  const expenseData = {
    id: expenseId,
    date,
    time,
    userName: fullName,
    userUsername: username,
    userId: from.id,
    groupTitle,
    chatId: chat.id,
    messageId: ctx.message?.message_id,
    expenseTitle: parsed.title,
    amount: parsed.amount
  };
  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);

  // 3. Send notification to Admin with interactive Category selection
  const adminMessageText =
    `📥 <b>Yangi xarajat keldi!</b>\n\n` +
    `📍 <b>Guruh:</b> ${groupTitle}\n` +
    `👤 <b>Foydalanuvchi:</b> ${fullName} (${username})\n` +
    `📝 <b>Nomi:</b> <code>${parsed.title}</code>\n` +
    `💰 <b>Summa:</b> <b>${formatNumber(parsed.amount)} so'm</b>\n` +
    `⏰ <b>Vaqti:</b> ${date} ${time}\n\n` +
    `<i>Qaysi kategoriyaga yozilsin? Tanlang:</i> 👇`;

  try {
    await ctx.telegram.sendMessage(adminId, adminMessageText, {
      parse_mode: 'HTML',
      ...buildCategoryKeyboard(expenseId)
    });
    console.log(`[INFO] [${date} ${time}] Yangi xarajat adminga yuborildi (${adminId}): "${parsed.title}" - ${parsed.amount}`);
  } catch (error) {
    console.error(`[ERROR] Adminga xabar yuborishda xatolik (${adminId}):`, error.message);
    if (error.message.includes('chat not found') || error.message.includes('bot was blocked')) {
      console.warn(`[WARNING] Admin (${adminId}) botga /start bosmagan! Bot unga birinchi bo'lib yozishi uchun admin botga /start yozishi kerak.`);
    }
  }
}

// Intercept all messages starting with /hisob
bot.hears(/^\/hisob/i, async (ctx) => {
  await handleExpenseMessage(ctx);
});

// Handle Category Selection callback query from Admin
bot.action(/^cat:(\w+):(.+)$/, async (ctx) => {
  const categoryKey = ctx.match[1];
  const expenseId = ctx.match[2];

  // Prevent double clicks
  if (processingSet.has(expenseId)) {
    try { await ctx.answerCbQuery('⏳ Saqlanmoqda, kuting...'); } catch {}
    return;
  }

  const rawMsgText = ctx.callbackQuery?.message?.text || '';
  let expense = pendingExpenses.get(expenseId);

  if (!expense) {
    expense = extractExpenseFromMessageText(rawMsgText);
  }

  if (!expense) {
    try { await ctx.answerCbQuery('✅ Bu xarajat allaqachon saqlangan.'); } catch {}
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch {}
    return;
  }

  const category = CATEGORIES[categoryKey];
  if (!category) {
    try { await ctx.answerCbQuery('❌ Noto\'g\'ri kategoriya!'); } catch {}
    return;
  }

  processingSet.add(expenseId);
  try { await ctx.answerCbQuery(`⏳ "${category.sheetTitleHeader}" kategoriyasiga saqlanmoqda...`); } catch {}

  // 1. Save to Google Sheets
  try {
    await appendExpenseByCategory(categoryKey, {
      expenseTitle: expense.expenseTitle,
      amount: expense.amount
    });
    console.log(`[OK] Saqlandi: [${category.label}] "${expense.expenseTitle}" - ${expense.amount}`);
  } catch (sheetErr) {
    console.error(`[ERROR] Google Sheets-ga yozishda xatolik:`, sheetErr.message);
    try { await ctx.reply(`❌ Google Sheets-ga yozishda xatolik: ${sheetErr.message}`); } catch {}
    processingSet.delete(expenseId);
    return;
  }

  // Remove from pending storage
  pendingExpenses.delete(expenseId);
  savePendingExpenses(pendingExpenses);

  const expenseDate = expense.date || getFormattedDateTime().date;
  const expenseTime = expense.time || getFormattedDateTime().time;

  // 2. Update Admin message in private chat (removes buttons)
  const updatedAdminText =
    `✅ <b>Google Sheets-ga muvaffaqiyatli saqlandi!</b>\n\n` +
    `📁 <b>Kategoriya:</b> ${category.label}\n` +
    `📝 <b>Nomi:</b> <code>${expense.expenseTitle}</code>\n` +
    `💰 <b>Summa:</b> <b>${formatNumber(expense.amount)} so'm</b>\n` +
    `👤 <b>Foydalanuvchi:</b> ${expense.userName} ${expense.userUsername ? `(${expense.userUsername})` : ''}\n` +
    `📍 <b>Guruh:</b> ${expense.groupTitle || 'Guruh'}\n` +
    `⏰ <b>Vaqti:</b> ${expenseDate} ${expenseTime}`;

  try {
    await ctx.editMessageText(updatedAdminText, { parse_mode: 'HTML' });
  } catch (editErr) {
    // Ignore harmless 'message is not modified' Telegram error
    if (!editErr.message.includes('message is not modified')) {
      console.warn('[WARNING] Edit message error:', editErr.message);
    }
  }

  // 3. Notify the group that the admin approved and saved the expense
  if (expense.chatId && String(expense.chatId) !== String(adminId)) {
    try {
      const groupNotificationText =
        `✅ <b>Xarajat tasdiqlandi va jadvalga kiritildi!</b>\n\n` +
        `📁 <b>Kategoriya:</b> ${category.label}\n` +
        `📝 <b>Nomi:</b> <code>${expense.expenseTitle}</code>\n` +
        `💰 <b>Summa:</b> <b>${formatNumber(expense.amount)} so'm</b>\n` +
        `👤 <b>Kiritgan:</b> ${expense.userName}\n` +
        `👨‍💼 <b>Tasdiqladi:</b> Administrator`;

      const sendOptions = { parse_mode: 'HTML' };
      if (expense.messageId) {
        sendOptions.reply_parameters = { message_id: expense.messageId };
      }

      await ctx.telegram.sendMessage(expense.chatId, groupNotificationText, sendOptions);
      console.log(`[INFO] Guruhga (${expense.chatId}) tasdiqlash xabari yuborildi.`);
    } catch (groupErr) {
      console.warn(`[WARNING] Guruhga xabar yuborishda xatolik:`, groupErr.message);
    }
  }

  processingSet.delete(expenseId);
});

// Handle Cancel callback query from Admin
bot.action(/^cancel:(.+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const rawMsgText = ctx.callbackQuery?.message?.text || '';
  let expense = pendingExpenses.get(expenseId) || extractExpenseFromMessageText(rawMsgText);

  if (expense) {
    pendingExpenses.delete(expenseId);
    savePendingExpenses(pendingExpenses);

    const updatedText =
      `❌ <b>Xarajat bekor qilindi (saqlanmadi)</b>\n\n` +
      `📝 <b>Nomi:</b> ${expense.expenseTitle}\n` +
      `💰 <b>Summa:</b> ${formatNumber(expense.amount)} so'm\n` +
      `👤 <b>Foydalanuvchi:</b> ${expense.userName}`;

    try {
      await ctx.editMessageText(updatedText, { parse_mode: 'HTML' });
      await ctx.answerCbQuery('❌ Bekor qilindi');
    } catch {}

    // Notify group about rejection
    if (expense.chatId && String(expense.chatId) !== String(adminId)) {
      try {
        const groupRejectText =
          `❌ <b>Xarajat rad etildi (saqlanmadi)</b>\n\n` +
          `📝 <b>Nomi:</b> <code>${expense.expenseTitle}</code>\n` +
          `💰 <b>Summa:</b> <b>${formatNumber(expense.amount)} so'm</b>\n` +
          `👤 <b>Kiritgan:</b> ${expense.userName}`;

        const sendOptions = { parse_mode: 'HTML' };
        if (expense.messageId) {
          sendOptions.reply_parameters = { message_id: expense.messageId };
        }

        await ctx.telegram.sendMessage(expense.chatId, groupRejectText, sendOptions);
      } catch {}
    }
  } else {
    try { await ctx.answerCbQuery('✅ Allaqachon bekor qilingan'); } catch {}
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch {}
  }
});

// /start command
bot.command('start', (ctx) => {
  if (ctx.chat.type === 'private') {
    const isOwner = String(ctx.from.id) === String(adminId);
    ctx.reply(
      `👋 <b>Assalomu alaykum!</b>\n\n` +
      `Men guruhdagi xarajatlarni boshqaruvchi va Google Sheets-ga saqlovchi botman.\n\n` +
      (isOwner
        ? `👑 <b>Siz administrator (${adminId}) sifatida aniqlandingiz!</b>\n` +
          `Guruhda yozilgan barcha xarajatlar tasdiqlash uchun shu yerga keladi.`
        : `📌 Guruhda xarajatlarni <code>/hisob nom summa</code> ko'rinishida yuborishingiz mumkin.`),
      { parse_mode: 'HTML' }
    );
  }
});

// Global error handlers
bot.catch((err, ctx) => {
  console.error(`[BOT ERROR] Xatolik (Update ID: ${ctx?.update?.update_id}):`, err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION] Sabab:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Xatolik:', err);
});

// Launch bot
function startBot() {
  console.log('⏳ Telegram-bot ishga tushmoqda...');
  bot.launch({
    allowedUpdates: ['message', 'callback_query']
  }).then(() => {
    console.log(`🚀 Bot muvaffaqiyatli ishga tushdi! Admin ID: ${adminId}`);
  }).catch((err) => {
    console.error('❌ Botni ishga tushirishda xatolik:', err.message);
    console.log('🔄 5 soniyadan so\'ng qayta uriniladi...');
    setTimeout(startBot, 5000);
  });
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
