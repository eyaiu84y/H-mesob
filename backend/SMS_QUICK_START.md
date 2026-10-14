# 📱 SMS Queue Notification - Quick Start

## ⚡ 5-Minute Setup

### 1️⃣ Register Africa's Talking (5 min)
```
1. Visit: https://africastalking.com
2. Sign up with business email
3. Go to Settings → API Key
4. Copy Username and API Key
```

### 2️⃣ Add Credentials (1 min)
Edit `backend/.env`:
```env
SMS_USERNAME=sandbox
SMS_API_KEY=paste_your_api_key_here
SMS_ENABLED=true
```

### 3️⃣ Run Database Migration (2 min)
```
1. Open Supabase Dashboard → SQL Editor
2. Copy content from: backend/database/migrations/004_add_sms_logs.sql
3. Paste and Run
```

### 4️⃣ Add Test Phone (Sandbox only) (1 min)
```
1. Africa's Talking Dashboard → Sandbox → Phone Numbers
2. Add your phone: +251912345678
```

### 5️⃣ Restart Server (1 min)
```bash
cd backend
npm run dev
```

Look for: `✅ SMS Service initialized successfully`

### 6️⃣ Test It! (2 min)
```
1. Login as citizen → Join queue
2. Check phone for confirmation SMS
3. Login as employee → Call next
4. Check phone for "you are called" SMS
```

---

## 📱 SMS Messages

### When Citizen Joins Queue:
```
MESOB: You joined the queue at Revenue Office.
Your token: Q-2026-0023. Position: 3.
You will receive an SMS when called.
```

### When Employee Calls Next:
```
MESOB Alert: Your queue number Q-2026-0023 
is now being called at Revenue Office. 
Please proceed to the service desk immediately.
```

---

## 🔍 Quick Troubleshooting

### No SMS received?
✅ Check `SMS_ENABLED=true` in .env  
✅ Check phone is registered (sandbox mode)  
✅ Check backend console for SMS logs  
✅ Verify API key is correct

### See error in console?
✅ `SMS disabled` → Set SMS_ENABLED=true  
✅ `SMS not configured` → Add API key  
✅ `Invalid API key` → Check API key in dashboard

---

## 💰 Cost
- **Testing:** FREE (sandbox credits included)
- **Production:** ~0.80 ETB per SMS
- **Monthly (100 users/day):** ~2,400 ETB

---

## 📚 Full Documentation
- Setup: `backend/SMS_SETUP_INSTRUCTIONS.md`
- Implementation: `SMS_QUEUE_NOTIFICATION_IMPLEMENTATION.md`

---

## ✨ What's Working
✅ SMS sent when citizen joins queue  
✅ SMS sent when employee calls citizen  
✅ SMS logs saved to database  
✅ Works with/without SMS (fallback to notifications)  
✅ English & Amharic messages  
✅ Auto phone number formatting
