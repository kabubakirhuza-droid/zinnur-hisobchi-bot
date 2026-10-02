import 'dotenv/config';
import http from 'http';
import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { parseExpenseCommand } from './parser.js';
import { appendExpenseByCategory, createNewMonthBlock, CATEGORIES, GROUPS, BRANCHES, UZ_MONTHS } from './sheets.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Telegram Zinnur Hisobchi Bot is running 24/7 on Render!');
});
server.listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

const botToken = process.env.BOT_TOKEN || '8760033475:AAGd1me4GB-F9u2ZZmeBilrQKuOtWU8QYRg';
const bot = new Telegraf(botToken);
const timeZone = process.env.TIMEZONE || 'Asia/Tashkent';

const ALL_ADMIN_IDS = Array.from(new Set([
  ...BRANCHES.uchtepa.adminIds,
  ...BRANCHES.sergeli.adminIds
]));

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

function buildMainKeyboard(expenseId, suggestedCategory = null, currentBranch = 'uchtepa') {
  const buttons = [];

  if (suggestedCategory) {
    buttons.push([
      Markup.button.callback(`✅ ${suggestedCategory.label}-ga saqlash`, `cat_${expenseId}_${suggestedCategory.key}`)
    ]);
  }

  // Branch switcher button
  const otherBranch = currentBranch === 'uchtepa' ? 'sergeli' : 'uchtepa';
  const otherBranchName = currentBranch === 'uchtepa' ? '🏬 Sergeliga o‘tkazish' : '🏢 Uchtepaga o‘tkazish';
  buttons.push([
    Markup.button.callback(`📍 Filial: ${BRANCHES[currentBranch]?.name}`, 'noop'),
    Markup.button.callback(otherBranchName, `swbranch_${expenseId}_${otherBranch}`)
  ]);

  // 4 Groups
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
  const isAdmin = ALL_ADMIN_IDS.includes(senderId);

  let message = `Assalomu alaykum, <b>${ctx.from?.first_name || 'Foydalanuvchi'}</b>!\n\n`;
  message += `Men <b>ZIN-NUR Xisobchi Boti</b>man (Uchtepa va Sergeli filiallari uchun).\n\n`;
  message += `📝 <b>Qanday ishlatiladi:</b>\n`;
  message += `• Uchtepa uchun: <code>/hisob uchtepa taksi 25 000</code>\n`;
  message += `• Sergeli uchun: <code>/hisob sergeli taksi 25 000</code>\n`;
  message += `• Teg bilan: <code>/hisob sergeli #tushlik 35000 osh</code>\n\n`;

  if (isAdmin) {
    let roles = [];
    if (BRANCHES.uchtepa.adminIds.includes(senderId)) roles.push('🏢 Uchtepa');
    if (BRANCHES.sergeli.adminIds.includes(senderId)) roles.push('🏬 Sergeli');
    message += `👑 <b>Siz Administrator sifatida tizimga ulangansiz!</b>\nFiliallar: <b>${roles.join(', ')}</b> (ID: <code>${senderId}</code>)\n\n`;
    message += `⚙️ Yangi oy ochish buyrug‘i:\n<code>/yangi_oy uchtepa Noyabr</code>\n<code>/yangi_oy sergeli Noyabr</code>`;
  } else {
    message += `📩 Xarajatingiz tegishli filial administratoriga yuboriladi. (ID: <code>${senderId}</code>)`;
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

  text += `💡 <i>Masalan: <code>/hisob sergeli #tushlik 20000 somsa</code></i>`;
  await ctx.replyWithHTML(text);
});

// /yangi_oy command
bot.command(['yangi_oy', 'new_month', 'ochish'], async (ctx) => {
  const senderId = String(ctx.from?.id);
  if (!ALL_ADMIN_IDS.includes(senderId)) {
    return ctx.reply('⚠️ Bu buyruq faqat administratorlar uchun.');
  }

  const parts = ctx.message.text.trim().split(/\s+/);
  let branch = 'uchtepa';
  let monthName = '';

  if (parts[1] && (parts[1].toLowerCase() === 'sergeli' || parts[1].toLowerCase() === 'uchtepa')) {
    branch = parts[1].toLowerCase();
    monthName = parts[2] || '';
  } else {
    monthName = parts[1] || '';
  }

  if (!monthName) {
    const nextMonthIdx = (new Date().getMonth() + 1) % 12;
    monthName = UZ_MONTHS[nextMonthIdx];
  }

  const branchConfig = BRANCHES[branch] || BRANCHES.uchtepa;
  await ctx.reply(`⏳ "${branchConfig.name}" uchun "${monthName}" oyi yangi jadvali ochilmoqda...`);

  try {
    await createNewMonthBlock(branchConfig.spreadsheetId, monthName, branchConfig.sheetTitle);
    await ctx.reply(`✅ <b>Muvaffaqiyatli!</b>\n${branchConfig.name} Google Jadvalida chap tomonda <b>${monthName}</b> oyi ochildi!`, { parse_mode: 'HTML' });
  } catch (err) {
    await ctx.reply(`❌ <b>Xatolik:</b> ${err.message}`, { parse_mode: 'HTML' });
  }
});

// In-memory active prompt tracking
const activePrompts = new Map();
const userLastPrompt = new Map();

async function handleExpenseSubmission({ ctx, rawText, branch, user, chatTitle, replyToMessageId }) {
  const details = parseExpenseDetails(rawText, branch, chatTitle);

  if (!details.success) {
    return { success: false, error: details.error };
  }

  const { title: expenseTitle, amount, rawAmount, branch: finalBranch, category: suggestedCategory } = details;
  const branchConfig = BRANCHES[finalBranch] || BRANCHES.uchtepa;

  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Noma\'lum';
  const userHandle = user.username ? `@${user.username}` : userName;
  const dateTime = formatDateTime();

  const expenseId = `${replyToMessageId || ctx.message?.message_id || Date.now()}_${Date.now()}`;

  const expenseData = {
    expenseId,
    chatId: ctx.chat.id,
    chatTitle: chatTitle || 'Shaxsiy chat',
    messageId: replyToMessageId || ctx.message?.message_id,
    userId: user.id,
    userHandle,
    userName,
    expenseTitle,
    amount,
    rawAmount,
    branch: finalBranch,
    date: dateTime.date,
    time: dateTime.time,
    adminMessages: {},
    createdAt: new Date().toISOString()
  };

  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);

  if (ctx.chat.type !== 'private') {
    try {
      await ctx.reply(`✅ <i>[${branchConfig.name}] Xarajat arizasi qabul qilindi ("${expenseTitle}" — ${formatAmountDisplay(amount)}) va adminga yuborildi.</i>`, {
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId || ctx.message?.message_id
      });
    } catch (e) {}
  } else {
    try {
      await ctx.reply(`✅ <i>[${branchConfig.name}] Xarajat arizasi qabul qilindi ("${expenseTitle}" — ${formatAmountDisplay(amount)}) va adminga yuborildi.</i>`, {
        parse_mode: 'HTML'
      });
    } catch (e) {}
  }

  let adminMessage = `🔔 <b>Yangi xarajat arizasi (${branchConfig.name})!</b>\n\n`;
  adminMessage += `📍 <b>Filial:</b> <b>${branchConfig.name}</b>\n`;
  adminMessage += `👤 <b>Yuboruvchi:</b> ${userName} (${userHandle})\n`;
  adminMessage += `📝 <b>Nomi:</b> <code>${expenseTitle}</code>\n`;
  adminMessage += `💵 <b>Summa:</b> <b>${formatAmountDisplay(amount)}</b>\n`;
  adminMessage += `📅 <b>Sana va vaqt:</b> ${dateTime.date} ${dateTime.time}\n\n`;
  adminMessage += `👇 <b>Xarajat qaysi bo‘limga tegishli?</b>`;

  const keyboard = buildMainKeyboard(expenseId, suggestedCategory, finalBranch);

  for (const adminId of branchConfig.adminIds) {
    try {
      const sentMsg = await bot.telegram.sendMessage(adminId, adminMessage, {
        parse_mode: 'HTML',
        ...keyboard
      });
      expenseData.adminMessages[adminId] = sentMsg.message_id;
    } catch (err) {
      console.warn(`[ADMIN NOTIFY WARNING] ID: ${adminId} ga yuborilmadi (${err.message}).`);
    }
  }

  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);
  console.log(`[EXPENSE QUEUED] [${branchConfig.name}] ID: ${expenseId} -> "${expenseTitle}" (${amount}) from ${userName}`);

  return { success: true, expenseId, expenseData };
}

// Handle /hisob, /hisob_uchtepa, /hisob_sergeli, /xarajat commands
bot.hears(/^\/(?:hisob|xarajat)(?:_(?:uchtepa|sergeli))?(?:@\w+)?(?:\s+.*)?$/is, async (ctx) => {
  const chatTitle = ctx.chat.title || '';
  const parsed = parseExpenseCommand(ctx.message.text, chatTitle);

  // If user clicked the command without arguments (e.g. from Telegram command menu)
  if (parsed.isEmptyPrompt) {
    const targetBranch = parsed.cmdBranch || (chatTitle.toLowerCase().includes('sergeli') ? 'sergeli' : 'uchtepa');
    const branchConfig = BRANCHES[targetBranch] || BRANCHES.uchtepa;

    try {
      const promptMsg = await ctx.reply(
        `✍️ <b>[${branchConfig.name}]</b> Iltimos, xarajat nomi va summasini yozing:\n<i>(Masalan: <code>taksi 25000</code> yoki <code>obed 35000 #tushlik</code>)</i>`,
        {
          parse_mode: 'HTML',
          reply_to_message_id: ctx.message.message_id,
          reply_markup: {
            force_reply: true,
            selective: true
          }
        }
      );

      const promptData = {
        userId: ctx.from.id,
        userName: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'Noma\'lum',
        branch: targetBranch,
        chatId: ctx.chat.id,
        chatTitle,
        promptMessageId: promptMsg.message_id,
        originalMessageId: ctx.message.message_id,
        expiresAt: Date.now() + 10 * 60 * 1000
      };

      activePrompts.set(promptMsg.message_id, promptData);
      userLastPrompt.set(`${ctx.chat.id}_${ctx.from.id}`, promptData);
    } catch (e) {
      console.error('[PROMPT ERROR]', e.message);
    }
    return;
  }

  if (!parsed.success) {
    if (ctx.chat.type === 'private') {
      await ctx.replyWithHTML(`⚠️ <b>Xatolik:</b> ${parsed.error}\n\nMisol: <code>/hisob uchtepa taksi 20000</code> yoki <code>/hisob sergeli taksi 20000</code>`);
    }
    return;
  }

  await handleExpenseSubmission({
    ctx,
    rawText: `${parsed.title} ${parsed.rawAmount}`,
    branch: parsed.branch,
    user: ctx.from,
    chatTitle,
    replyToMessageId: ctx.message.message_id
  });
});

// Handle plain text responses to prompts
bot.on('text', async (ctx, next) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return next();

  const userKey = `${ctx.chat.id}_${ctx.from.id}`;
  const replyToId = ctx.message.reply_to_message?.message_id;

  let promptContext = null;
  if (replyToId && activePrompts.has(replyToId)) {
    promptContext = activePrompts.get(replyToId);
  } else if (userLastPrompt.has(userKey)) {
    const last = userLastPrompt.get(userKey);
    if (Date.now() < last.expiresAt) {
      promptContext = last;
    } else {
      userLastPrompt.delete(userKey);
    }
  }

  // If this message is a response to an active prompt or in private chat
  if (promptContext) {
    const result = await handleExpenseSubmission({
      ctx,
      rawText: text,
      branch: promptContext.branch || 'uchtepa',
      user: ctx.from,
      chatTitle: ctx.chat.title || promptContext.chatTitle || '',
      replyToMessageId: ctx.message.message_id
    });

    if (result.success) {
      if (promptContext.promptMessageId) activePrompts.delete(promptContext.promptMessageId);
      userLastPrompt.delete(userKey);
      return;
    } else if (replyToId && activePrompts.has(replyToId)) {
      await ctx.reply(`⚠️ Summani aniqlab bo‘lmadi. Iltimos, xarajat <b>nomi va summasini</b> yozing (masalan: <code>taksi 25000</code>)`, {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  }

  // If in private chat, try parsing expense details directly
  if (ctx.chat.type === 'private') {
    const parsed = parseExpenseDetails(text, 'uchtepa');
    if (parsed.success) {
      await handleExpenseSubmission({
        ctx,
        rawText: text,
        branch: parsed.branch || 'uchtepa',
        user: ctx.from,
        chatTitle: 'Shaxsiy chat',
        replyToMessageId: ctx.message.message_id
      });
      return;
    }
  }

  return next();
});
  const expenseId = ctx.match[1];
  const newBranch = ctx.match[2];
  const expenseData = pendingExpenses.get(expenseId);

  if (!expenseData) {
    await ctx.answerCbQuery('⚠️ Bu ariza eskirgan.');
    return;
  }

  expenseData.branch = newBranch;
  pendingExpenses.set(expenseId, expenseData);
  savePendingExpenses(pendingExpenses);

  const branchConfig = BRANCHES[newBranch] || BRANCHES.uchtepa;
  const keyboard = buildMainKeyboard(expenseId, null, newBranch);

  let text = `🔔 <b>Xarajat arizasi (${branchConfig.name}):</b>\n\n`;
  text += `📍 <b>Filial:</b> <b>${branchConfig.name}</b>\n`;
  text += `👤 <b>Yuboruvchi:</b> ${expenseData.userName} (${expenseData.userHandle})\n`;
  text += `📝 <b>Nomi:</b> <code>${expenseData.expenseTitle}</code>\n`;
  text += `💵 <b>Summa:</b> <b>${formatAmountDisplay(expenseData.amount)}</b>\n`;
  text += `📅 <b>Sana:</b> ${expenseData.date} ${expenseData.time}\n\n`;
  text += `👇 Kerakli bo‘limni tanlang:`;

  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
    await ctx.answerCbQuery(`Filial o'zgartirildi: ${branchConfig.name}`);
  } catch (e) {
    await ctx.answerCbQuery();
  }
});

// Group selection callback
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
  const branchConfig = BRANCHES[expenseData.branch] || BRANCHES.uchtepa;

  const keyboard = buildGroupKeyboard(expenseId, groupKey);

  let text = `📂 <b>${groupLabel}</b> (${branchConfig.name}):\n\n`;
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

  const branchConfig = BRANCHES[expenseData.branch] || BRANCHES.uchtepa;
  const keyboard = buildMainKeyboard(expenseId, null, expenseData.branch);

  let text = `🔔 <b>Xarajat arizasi (${branchConfig.name}):</b>\n\n`;
  text += `📍 <b>Filial:</b> <b>${branchConfig.name}</b>\n`;
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

// Noop callback
bot.action('noop', async (ctx) => {
  await ctx.answerCbQuery();
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
      branch: expenseData.branch || 'uchtepa',
      date: new Date()
    });

    pendingExpenses.delete(expenseId);
    savePendingExpenses(pendingExpenses);

    const adminWhosaved = ctx.from?.first_name || 'Admin';

    let successText = `✅ <b>Google Jadvalga muvaffaqiyatli saqlandi!</b>\n\n`;
    successText += `📍 <b>Filial:</b> <b>${result.branch}</b>\n`;
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

    console.log(`[SAVED TO SHEETS] [${result.branch}] ${result.category} | Row: ${result.row} | Amount: ${result.addedAmount}`);
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
    const branchConfig = BRANCHES[expenseData.branch] || BRANCHES.uchtepa;
    cancelText += `📍 <b>Filial:</b> ${branchConfig.name}\n`;
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
bot.launch().then(async () => {
  console.log(`🚀 Zinnur Hisobchi Bot (Uchtepa + Sergeli) muvaffaqiyatli ishga tushdi!`);
  try {
    const commands = [
      { command: 'hisob_uchtepa', description: '🏢 Uchtepa: /hisob_uchtepa taksi 25000' },
      { command: 'hisob_sergeli', description: '🏬 Sergeli: /hisob_sergeli taksi 25000' },
      { command: 'hisob', description: '📝 Xarajat: /hisob filial nomi summa' },
      { command: 'tags', description: '📋 43 ta teglar va bo‘limlar ro‘yxati' },
      { command: 'yangi_oy', description: '📅 Yangi oy ochish (Admin uchun)' }
    ];
    await bot.telegram.setMyCommands(commands);
    await bot.telegram.setMyCommands(commands, { scope: { type: 'all_group_chats' } });
    await bot.telegram.setMyCommands(commands, { scope: { type: 'all_chat_administrators' } });
  } catch (e) {
    console.warn('Command menu setup warning:', e.message);
  }
}).catch((err) => {
  console.error('[BOT LAUNCH ERROR]', err.message);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
