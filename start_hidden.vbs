Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Hello\.gemini\antigravity\scratch\telegram-expense-bot"
WshShell.Run "node src/bot.js", 0, False
