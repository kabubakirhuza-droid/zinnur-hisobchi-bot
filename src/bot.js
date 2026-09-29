import 'dotenv/config';
import http from 'http';
import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { parseExpenseCommand } from './parser.js';
import { appendExpenseByCategory, CATEGORIES, GROUPS, UZ_MONTHS } from './sheets.js';

// Lightweight HTTP server for Render.com Web Service health check
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Telegram Zinnur Hisobchi Bot is running 24/7 on Render!');
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

// Persistent storage file for pending expenses
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

function formatDateTime(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(date);

    const map = {};
    for (const p of parts) map[p.type] = p.value;

    return {
      date: `${map.day}.${map.month}.${map.year}`,
      time: `${map.hour}:${map.minute}:${map.second}`
    };
  } catch (e) {
    const d = new Date();
    return {
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().split(' ')[0]
    };
  }
}

function formatAmountDisplay(num) {
  const formatted = num.toLocaleString('ru-RU');
  if (num >= 1000) {
    const thousands = (num / 1000).toLocaleString('ru-RU');
    return `${formatted} so'm (${thousands} ming)`;
  }
  return `${formatted} ming so'm`;
}

/**
 * Builds the initial Group Selection keyboard or Suggested Category keyboard.
 */
function buildMainKeyboard(expenseId, suggestedCategory = null) {
  const buttons = [];

  if (suggestedCategory) {
    buttons.push([
      Markup.button.callback(`✅ ${suggestedCategory.label}-ga saqlash`, `cat_${expenseId}_${suggestedCategory.key}`)
    ]);
  }

  // 4 Main Groups
  buttons.push([
    Markup.button.callback('👥 Xodimlar (19)', `grp_${expenseId}_xodimlar`),
    Markup.button.callback('🏢 Ofis & Xo‘jalik (11)', `grp_${expenseId}_ofis`)
  ]);
  buttons.push([
    Markup.button.callback('📢 Marketing & Sotuv (7)', `grp_${expenseId}_marketing`),
    Markup.button.callback('🔄 Qarz & Boshqa (5)', `grp_${expenseId}_boshqa`)
  ]);
  buttons.push([
    Markup.button.callback('❌ Bekor qilish', `cancel_${expenseId}`)
  ]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Builds category buttons for a specific group.
 */
function buildGroupKeyboard(expenseId, groupKey) {
  const groupCategories = CATEGORIES.filter(c => c.group === groupKey);
  const buttons = [];

  for (let i = 0; i < groupCategories.length; i += 2) {
    const row = [];
    row.push(Markup.button.callback(groupCategories[i].label, `cat_${expenseId}_${groupCategories[i].key}`));
    if (i + 1 < groupCategories.length) {
      row.push(Markup.button.callback(groupCategories[i + 1].label, `cat_${expenseId}_${groupCategories[i + 1].key}`));
    }
    buttons.push(row);
  }

  // Navigation row
  buttons.push([
    Markup.button.callback('⬅️ Boshqa bo‘limlar', `back_${expenseId}`),
    Markup.button.callback('❌ Bekor qilish', `cancel_${expenseId}`)
  ]);

  return Markup.inlineKeyboard(buttons);
}

// /start command
bot.start(async (ctx) => {
  const senderId = String(ctx.from?.id);
  const isAdmin = senderId === String(adminId);

  let message = `Assalomu alaykum, <b>${ctx.from?.first_name || 'Foydalanuvchi'}</b>!\n\n`;
  message += `Men <b>ZIN-NUR Xisobchi Boti</b>man.\n\n`;
  message += `📝 <b>Qanday ishlatiladi:</b>\n`;
  message += `Guruhda yoki shu yerda xarajatni yozing:\n`;
  message += `<code>/hisob taksi 25 000</code>\n`;
  message += `<code>/hisob #tushlik 35000 osh</code>\n`;
  message += `<code>/hisob #arenda 41527000</code>\n\n`;

  if (isAdmin) {
    message += `👑 <b>Siz Administrator sifatida tizimga ulangansiz!</b>\n`;
    message += `Barcha xarajatlarni tasdiqlash va bo'limlarga biriktirish xabarlari sizga yuboriladi.`;
  } else {
    message += `📩 Xarajatingiz administrator tasdiqlashi uchun yuboriladi va Google Jadvalga saqlanadi.`;
  }

  await ctx.replyWithHTML(message);
});

// /tags or /kategoriya command to list all tags
bot.command(['tags', 'teglar', 'kategoriyalar'], async (ctx) => {
  let text = `📋 <b>Barcha mavjud bo‘limlar va teglar (43 ta):</b>\n\n`;

  for (const grp of GROUPS) {
    const list = CATEGORIES.filter(c => c.group === grp.key);
    text += `<b>${grp.label}:</b>\n`;
    text += list.map(c => `• <code>#${c.key}</code> — ${c.label}`).join('\n');
    text += `\n\n`;
  }

  text += `💡 <i>Masalan: <code>/hisob #tushlik 20 000 somsa</code></i>`;
  await ctx.replyWithHTML(text);
});

// Handle /hisob and /xarajat commands
bot.hears(/^\/(?:hisob|xarajat)(?:@\w+)?(?:\s+.*)?$/is, async (ctx) => {
  const parsed = parseExpenseCommand(ctx.message.text);

  if (!parsed.success) {
    if (ctx.chat.type === 'private') {
      await ctx.replyWithHTML(`⚠️ <b>Xatolik:</b> ${parsed.error}\n\nMisol: <code>/hisob taksi 20000</code>`);
    }
    return;
  }

  const { title: expenseTitle, amount, rawAmount, category: suggestedCategory } = parsed;
  const user = ctx.from;
  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Noma\'lum';
  const userHandle = user.username ? `@${user.username}` : userName;
  const chatTitle = ctx.chat.title || 'Shaxsiy chat';
  const dateTime = formatDateTime();

  const expenseId = `${ctx.message.message_id}_${Date.now()}`;

  const expenseData = {
    expenseId,
    chatId: ctx.chat.id,
    chatTitle,
    messageId: ctx.message.message_id,
    userId: user.id,
    userHandle,
    userName,
    expenseTitle,
    amount,
    rawAmount,
    date: dateTime.date,
    time: dateTime.time,
    createdAt: new Date().toISOString()
  };

  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);

  let adminMessage = `🔔 <b>Yangi xarajat arizasi!</b>\n\n`;
  adminMessage += `👤 <b>Yuboruvchi:</b> ${userName} (${userHandle})\n`;
  adminMessage += `📍 <b>Manba:</b> ${chatTitle}\n`;
  adminMessage += `📝 <b>Nomi:</b> <code>${expenseTitle}</code>\n`;
  adminMessage += `💵 <b>Summa:</b> <b>${formatAmountDisplay(amount)}</b>\n`;
  adminMessage += `📅 <b>Sana va vaqt:</b> ${dateTime.date} ${dateTime.time}\n\n`;
  adminMessage += `👇 <b>Xarajat qaysi bo‘limga tegishli?</b>`;

  const keyboard = buildMainKeyboard(expenseId, suggestedCategory);

  try {
    const sentMsg = await bot.telegram.sendMessage(adminId, adminMessage, {
      parse_mode: 'HTML',
      ...keyboard
    });

    expenseData.adminMessageId = sentMsg.message_id;
    pendingExpenses.set(expenseId, expenseData);
    savePendingExpenses(pendingExpenses);
    console.log(`[EXPENSE QUEUED] ID: ${expenseId} -> "${expenseTitle}" (${amount}) from ${userName}`);
  } catch (err) {
    console.error('[CRITICAL] Admin xabari yuborilmadi:', err.message);
    if (ctx.chat.type === 'private') {
      await ctx.reply(`⚠️ Xarajatni adminga yuborishda xatolik: ${err.message}`);
    }
  }
});

// Group selection callback (grp_<expenseId>_<groupKey>)
bot.action(/^grp_([^_]+_\d+)_(.+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const groupKey = ctx.match[2];
  const expenseData = pendingExpenses.get(expenseId);

  if (!expenseData) {
    await ctx.answerCbQuery('⚠️ Bu ariza eskirgan yoki bekor qilingan.');
    return;
  }

  const groupInfo = GROUPS.find(g => g.key === groupKey);
  const groupLabel = groupInfo ? groupInfo.label : groupKey;

  const keyboard = buildGroupKeyboard(expenseId, groupKey);

  let text = `📂 <b>${groupLabel}</b> bo‘limi:\n\n`;
  text += `📝 <b>Nomi:</b> <code>${expenseData.expenseTitle}</code>\n`;
  text += `💵 <b>Summa:</b> <b>${formatAmountDisplay(expenseData.amount)}</b>\n`;
  text += `👤 <b>Yuboruvchi:</b> ${expenseData.userName}\n\n`;
  text += `Kerakli kategoriyani tanlang:`;

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...keyboard
    });
    await ctx.answerCbQuery();
  } catch (e) {
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
});

// Back to main categories menu callback (back_<expenseId>)
bot.action(/^back_([^_]+_\d+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const expenseData = pendingExpenses.get(expenseId);

  if (!expenseData) {
    await ctx.answerCbQuery('⚠️ Bu ariza topilmadi.');
    return;
  }

  const keyboard = buildMainKeyboard(expenseId);

  let text = `🔔 <b>Xarajatni bo‘limga biriktirish:</b>\n\n`;
  text += `👤 <b>Yuboruvchi:</b> ${expenseData.userName} (${expenseData.userHandle})\n`;
  text += `📝 <b>Nomi:</b> <code>${expenseData.expenseTitle}</code>\n`;
  text += `💵 <b>Summa:</b> <b>${formatAmountDisplay(expenseData.amount)}</b>\n`;
  text += `📅 <b>Sana:</b> ${expenseData.date} ${expenseData.time}\n\n`;
  text += `👇 Kerakli bo‘limni tanlang:`;

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      ...keyboard
    });
    await ctx.answerCbQuery();
  } catch (e) {
    await ctx.answerCbQuery();
  }
});

// Category selection callback (cat_<expenseId>_<categoryKey>)
bot.action(/^cat_([^_]+_\d+)_(.+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const categoryKey = ctx.match[2];

  if (processingSet.has(expenseId)) {
    await ctx.answerCbQuery('⏳ Saqlanmoqda, kuting...');
    return;
  }

  const expenseData = pendingExpenses.get(expenseId);
  if (!expenseData) {
    await ctx.answerCbQuery('⚠️ Bu xarajat allaqachon ko‘rib chiqilgan yoki topilmadi.');
    try {
      await ctx.editMessageText('⚠️ Bu xarajat allaqachon ko‘rib chiqilgan yoki eskirgan.');
    } catch (e) {}
    return;
  }

  processingSet.add(expenseId);
  await ctx.answerCbQuery('⏳ Google Jadvalga saqlanmoqda...');

  try {
    const result = await appendExpenseByCategory(categoryKey, {
      expenseTitle: expenseData.expenseTitle,
      amount: expenseData.amount,
      date: new Date()
    });

    pendingExpenses.delete(expenseId);
    savePendingExpenses(pendingExpenses);

    let successText = `✅ <b>Google Jadvalga muvaffaqiyatli saqlandi!</b>\n\n`;
    successText += `📊 <b>Kategoriya:</b> <code>${result.category}</code>\n`;
    successText += `📝 <b>Nomi:</b> ${expenseData.expenseTitle}\n`;
    successText += `💵 <b>Yozilgan summa:</b> ${result.addedAmount} ming (${formatAmountDisplay(expenseData.amount)})\n`;
    successText += `📅 <b>Oy va kun:</b> ${result.month}, ${result.day}-kun (Qator: ${result.row})\n`;
    successText += `👤 <b>Yuboruvchi:</b> ${expenseData.userName} (${expenseData.userHandle})\n`;
    successText += `🕒 <b>Vaqti:</b> ${expenseData.date} ${expenseData.time}`;

    await ctx.editMessageText(successText, { parse_mode: 'HTML' });
    console.log(`[SAVED TO SHEETS] ${result.category} | Row: ${result.row} | Amount: ${result.addedAmount}`);
  } catch (err) {
    console.error('[SHEETS ERROR]', err.message);
    await ctx.reply(`❌ <b>Xatolik yuz berdi:</b> ${err.message}`, { parse_mode: 'HTML' });
  } finally {
    processingSet.delete(expenseId);
  }
});

// Cancel callback (cancel_<expenseId>)
bot.action(/^cancel_([^_]+_\d+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const expenseData = pendingExpenses.get(expenseId);

  pendingExpenses.delete(expenseId);
  savePendingExpenses(pendingExpenses);

  let cancelText = `❌ <b>Xarajat arizasi bekor qilindi.</b>\n\n`;
  if (expenseData) {
    cancelText += `📝 <b>Nomi:</b> ${expenseData.expenseTitle}\n`;
    cancelText += `💵 <b>Summa:</b> ${formatAmountDisplay(expenseData.amount)}\n`;
    cancelText += `👤 <b>Yuboruvchi:</b> ${expenseData.userName}`;
  }

  try {
    await ctx.editMessageText(cancelText, { parse_mode: 'HTML' });
    await ctx.answerCbQuery('Bekor qilindi');
  } catch (e) {
    await ctx.answerCbQuery();
  }
});

// Start bot polling
bot.launch().then(() => {
  console.log(`🚀 Zinnur Hisobchi Bot muvaffaqiyatli ishga tushdi! Admin ID: ${adminId}`);
}).catch((err) => {
  console.error('[BOT LAUNCH ERROR]', err.message);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
