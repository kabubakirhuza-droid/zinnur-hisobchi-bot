import 'dotenv/config';
import http from 'http';
import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { parseExpenseCommand } from './parser.js';
import { appendExpenseByCategory, createNewMonthBlock, CATEGORIES, GROUPS, UZ_MONTHS } from './sheets.js';

// Lightweight HTTP server for Render.com Web Service health check
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Telegram Zinnur Hisobchi Bot is running 24/7 on Render!');
});
server.listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

const botToken = process.env.BOT_TOKEN || '8760033475:AAGd1me4GB-F9u2ZZmeBilrQKuOtWU8QYRg';
const defaultAdmins = ['5709203608', '716752890'];
const envAdmins = process.env.ADMIN_IDS || process.env.ADMIN_ID || '';
const ADMIN_IDS = Array.from(new Set([
  ...defaultAdmins,
  ...envAdmins.split(',').map(s => s.trim()).filter(Boolean)
]));

const bot = new Telegraf(botToken);
const timeZone = process.env.TIMEZONE || 'Asia/Tashkent';

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

function buildMainKeyboard(expenseId, suggestedCategory = null) {
  const buttons = [];

  if (suggestedCategory) {
    buttons.push([
      Markup.button.callback(`✅ ${suggestedCategory.label}-ga saqlash`, `cat_${expenseId}_${suggestedCategory.key}`)
    ]);
  }

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

  buttons.push([
    Markup.button.callback('⬅️ Boshqa bo‘limlar', `back_${expenseId}`),
    Markup.button.callback('❌ Bekor qilish', `cancel_${expenseId}`)
  ]);

  return Markup.inlineKeyboard(buttons);
}

// /start command
bot.start(async (ctx) => {
  const senderId = String(ctx.from?.id);
  const isAdmin = ADMIN_IDS.includes(senderId);

  let message = `Assalomu alaykum, <b>${ctx.from?.first_name || 'Foydalanuvchi'}</b>!\n\n`;
  message += `Men <b>ZIN-NUR Xisobchi Boti</b>man.\n\n`;
  message += `📝 <b>Qanday ishlatiladi:</b>\n`;
  message += `Guruhda yoki shu yerda xarajatni yozing:\n`;
  message += `<code>/hisob taksi 25 000</code>\n`;
  message += `<code>/hisob #tushlik 35000 osh</code>\n`;
  message += `<code>/hisob #arenda 41527000</code>\n\n`;

  if (isAdmin) {
    message += `👑 <b>Siz Administrator sifatida tizimga ulangansiz!</b> (ID: <code>${senderId}</code>)\n`;
    message += `Barcha xarajatlarni tasdiqlash va bo'limlarga biriktirish xabarlari sizga yuboriladi.\n\n`;
    message += `⚙️ Yangi oy ochish buyrug‘i: <code>/yangi_oy Noyabr</code>`;
  } else {
    message += `📩 Xarajatingiz administrator tasdiqlashi uchun yuboriladi va Google Jadvalga saqlanadi. (Sizning ID: <code>${senderId}</code>)`;
  }

  await ctx.replyWithHTML(message);
});

// /tags command
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

// /yangi_oy command for admin to create next month block on the left
bot.command(['yangi_oy', 'new_month', 'ochish'], async (ctx) => {
  const senderId = String(ctx.from?.id);
  if (!ADMIN_IDS.includes(senderId)) {
    return ctx.reply('⚠️ Bu buyruq faqat administratorlar uchun.');
  }

  const parts = ctx.message.text.trim().split(/\s+/);
  let monthName = parts[1];
  if (!monthName) {
    const nextMonthIdx = (new Date().getMonth() + 1) % 12;
    monthName = UZ_MONTHS[nextMonthIdx];
  }

  await ctx.reply(`⏳ "${monthName}" oyi uchun chap tomonda yangi jadval ochilmoqda...`);

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID || '1SrAtH5bLRXD3KrMw0km-F8T0CmpzaNO8Xy1n0sOiAYE';
    await createNewMonthBlock(spreadsheetId, monthName, 'X N');
    await ctx.reply(`✅ <b>Muvaffaqiyatli!</b>\nGoogle Sheets "X N" varag‘ida chap tomonda <b>${monthName}</b> oyi jadvali ochildi!`, { parse_mode: 'HTML' });
  } catch (err) {
    await ctx.reply(`❌ <b>Xatolik:</b> ${err.message}`, { parse_mode: 'HTML' });
  }
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
    adminMessages: {},
    createdAt: new Date().toISOString()
  };

  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);

  // In group, give instant polite confirmation
  if (ctx.chat.type !== 'private') {
    try {
      await ctx.reply(`📩 <i>Xarajat arizasi qabul qilindi va adminga yuborildi.</i>`, {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message.message_id
      });
    } catch (e) {}
  }

  let adminMessage = `🔔 <b>Yangi xarajat arizasi!</b>\n\n`;
  adminMessage += `👤 <b>Yuboruvchi:</b> ${userName} (${userHandle})\n`;
  adminMessage += `📍 <b>Manba:</b> ${chatTitle}\n`;
  adminMessage += `📝 <b>Nomi:</b> <code>${expenseTitle}</code>\n`;
  adminMessage += `💵 <b>Summa:</b> <b>${formatAmountDisplay(amount)}</b>\n`;
  adminMessage += `📅 <b>Sana va vaqt:</b> ${dateTime.date} ${dateTime.time}\n\n`;
  adminMessage += `👇 <b>Xarajat qaysi bo‘limga tegishli?</b>`;

  const keyboard = buildMainKeyboard(expenseId, suggestedCategory);

  // Send to all registered admins
  for (const adminId of ADMIN_IDS) {
    try {
      const sentMsg = await bot.telegram.sendMessage(adminId, adminMessage, {
        parse_mode: 'HTML',
        ...keyboard
      });
      expenseData.adminMessages[adminId] = sentMsg.message_id;
    } catch (err) {
      console.warn(`[ADMIN NOTIFY WARNING] ID: ${adminId} ga yuborilmadi (${err.message}). Ehtimol botga /start bosmagan.`);
    }
  }

  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);
  console.log(`[EXPENSE QUEUED] ID: ${expenseId} -> "${expenseTitle}" (${amount}) from ${userName}`);
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

// Back callback
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

// Category selection callback
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

    const adminWhosaved = ctx.from?.first_name || 'Admin';

    let successText = `✅ <b>Google Jadvalga muvaffaqiyatli saqlandi!</b>\n\n`;
    successText += `📊 <b>Kategoriya:</b> <code>${result.category}</code>\n`;
    successText += `📝 <b>Nomi:</b> ${expenseData.expenseTitle}\n`;
    successText += `💵 <b>Yozilgan summa:</b> ${result.addedAmount} ming (${formatAmountDisplay(expenseData.amount)})\n`;
    successText += `📅 <b>Oy va kun:</b> ${result.month}, ${result.day}-kun (Qator: ${result.row})\n`;
    successText += `👤 <b>Yuboruvchi:</b> ${expenseData.userName} (${expenseData.userHandle})\n`;
    successText += `👑 <b>Tasdiqladi:</b> ${adminWhosaved}\n`;
    successText += `🕒 <b>Vaqti:</b> ${expenseData.date} ${expenseData.time}`;

    await ctx.editMessageText(successText, { parse_mode: 'HTML' });

    if (expenseData.adminMessages) {
      for (const [admId, msgId] of Object.entries(expenseData.adminMessages)) {
        if (String(admId) !== String(ctx.from?.id)) {
          try {
            await bot.telegram.editMessageText(admId, msgId, null, successText, { parse_mode: 'HTML' });
          } catch (e) {}
        }
      }
    }

    console.log(`[SAVED TO SHEETS] ${result.category} | Row: ${result.row} | Amount: ${result.addedAmount}`);
  } catch (err) {
    console.error('[SHEETS ERROR]', err.message);
    await ctx.reply(`❌ <b>Xatolik yuz berdi:</b> ${err.message}`, { parse_mode: 'HTML' });
  } finally {
    processingSet.delete(expenseId);
  }
});

// Cancel callback
bot.action(/^cancel_([^_]+_\d+)$/, async (ctx) => {
  const expenseId = ctx.match[1];
  const expenseData = pendingExpenses.get(expenseId);

  pendingExpenses.delete(expenseId);
  savePendingExpenses(pendingExpenses);

  const adminWhocancelled = ctx.from?.first_name || 'Admin';
  let cancelText = `❌ <b>Xarajat arizasi bekor qilindi (${adminWhocancelled} tomonidan).</b>\n\n`;
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
  console.log(`🚀 Zinnur Hisobchi Bot muvaffaqiyatli ishga tushdi! Adminlar: ${ADMIN_IDS.join(', ')}`);
}).catch((err) => {
  console.error('[BOT LAUNCH ERROR]', err.message);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
