# 🚀 Telegram Bot - Quick Start Guide

**Quick guide to test the Hawassa MESOB Telegram Bot foundation**

---

## ⚡ SUPER QUICK START (3 Steps)

### 1. Get Bot Token

1. Open Telegram
2. Search: `@BotFather`
3. Send: `/newbot`
4. Follow prompts
5. **Copy the token**

### 2. Configure

```bash
cd backend

# Add token to .env file
echo "TELEGRAM_BOT_TOKEN=your_token_here" >> .env
```

### 3. Run

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start bot
npm run bot
```

**Done! Open Telegram and chat with your bot.**

---

## 📱 HOW TO TEST

### Send Commands

```
/start   → Welcome message + language selection
/menu    → Main menu
/help    → Help information
```

### Test Language Selection

1. Send `/start`
2. Click 🇬🇧 English or 🇪🇹 አማርኛ
3. Language changes
4. Menu appears in selected language

### Test Navigation

1. Click any menu button
2. "Coming soon" message appears
3. Click "Back to Main Menu"
4. Returns to menu

### Test All Features

- [ ] /start works
- [ ] Language selection works
- [ ] English messages show correctly
- [ ] Amharic messages show correctly
- [ ] Main menu appears
- [ ] All 8 menu items respond
- [ ] Back button works
- [ ] /menu command works
- [ ] /help command works
- [ ] Invalid input handled gracefully
- [ ] No errors in terminal

---

## ✅ EXPECTED RESULTS

### When Bot Starts

```
╔════════════════════════════════════════════════════════╗
║   🤖 HAWASSA MESOB TELEGRAM BOT STARTED               ║
╚════════════════════════════════════════════════════════╝

✅ Bot is running and waiting for messages...
🔗 Connected to Telegram API
📊 Backend API: http://localhost:5000/api

✅ Commands registered: /start, /menu, /help
✅ Callback handlers registered
✅ Message handlers registered
✅ Error handlers registered
```

### When User Sends /start

```
👋 Welcome to Hawassa MESOB!

Your gateway to efficient government services in Hawassa City.

Please select your preferred language:

[🇬🇧 English] [🇪🇹 አማርኛ]
```

### After Language Selection

```
📋 Main Menu

Choose a service:

1️⃣ Service Requirements
2️⃣ Queue Management
3️⃣ Application Tracking
4️⃣ Maintenance Report
5️⃣ Task Assignment
6️⃣ Announcements & Notifications
⚙️ Settings
❓ Help
```

---

## ⚠️ TROUBLESHOOTING

### Bot Won't Start

**Problem:** `TELEGRAM_BOT_TOKEN is required`

**Solution:**
```bash
# Check .env file
cat .env | grep TELEGRAM_BOT_TOKEN

# If missing, add it:
echo "TELEGRAM_BOT_TOKEN=your_token_here" >> .env
```

---

### Backend Not Running

**Problem:** `ECONNREFUSED`

**Solution:**
```bash
# Terminal 1: Start backend first
cd backend
npm start
```

---

### Bot Token Invalid

**Problem:** `401 Unauthorized`

**Solution:**
1. Token might be wrong
2. Bot might be revoked
3. Create a new bot with @BotFather

---

### Can't Find Bot on Telegram

**Problem:** Bot not showing up

**Solution:**
1. Get bot username from @BotFather
2. Search for bot by exact username
3. Or use the link provided by BotFather

---

## 🎯 WHAT'S WORKING

✅ **Foundation Features:**
- Bot startup
- /start command
- Language selection (English/Amharic)
- Main menu
- Navigation
- Error handling
- Graceful shutdown

✅ **What Shows "Coming Soon":**
- Service Requirements
- Queue Management
- Application Tracking
- Maintenance Report
- Task Assignment
- Announcements

**This is correct! Business features not implemented yet.**

---

## 📞 NEED HELP?

**Common Questions:**

**Q: Why do all menu items say "coming soon"?**  
A: This is the foundation only. Business features will be implemented next.

**Q: How do I link my MESOB account?**  
A: Account linking not implemented yet. Coming in next phase.

**Q: Can I search for services?**  
A: Not yet. Coming in next phase.

**Q: Where is the backend code?**  
A: Backend is separate. Bot connects to existing backend API.

**Q: Is this production ready?**  
A: Foundation is ready. Business features coming next.

---

## 📊 TEST CHECKLIST

Print this and check off as you test:

```
[ ] Bot starts without errors
[ ] /start shows welcome message
[ ] English language works
[ ] Amharic language works
[ ] Language switching works
[ ] Main menu appears
[ ] All 8 buttons respond
[ ] "Coming soon" shows for features
[ ] Back button works
[ ] /menu command works
[ ] /help command works
[ ] Settings button works
[ ] Language change in settings works
[ ] Invalid commands handled gracefully
[ ] No secrets in messages
[ ] No errors in terminal
[ ] Bot stops gracefully (Ctrl+C)
[ ] Backend still works after bot starts
[ ] No regressions in backend tests
```

**18/18 = Ready for next phase!**

---

## 🚦 NEXT STEPS

After testing foundation:

1. ✅ Confirm all tests pass
2. ➡️ Design account linking workflow
3. ➡️ Implement service browsing
4. ➡️ Implement queue management
5. ➡️ Implement application tracking
6. ➡️ Deploy to production

---

**Happy Testing! 🎉**

---

**Document Version:** 1.0  
**Last Updated:** August 24, 2026  
**Status:** Foundation Testing Phase
