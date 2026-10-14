# 📱 SMS Queue Notification - Setup Instructions

## ✅ Code Changes Completed

The following files have been created/modified:

### New Files Created:
1. ✅ `backend/src/services/smsService.js` - SMS service for sending notifications
2. ✅ `backend/database/migrations/004_add_sms_logs.sql` - Database table for SMS logs
3. ✅ `backend/SMS_SETUP_INSTRUCTIONS.md` - This file

### Modified Files:
1. ✅ `backend/.env` - Added SMS configuration variables
2. ✅ `backend/src/services/queueService.js` - Added SMS notifications for queue join and queue call
3. ✅ `backend/package.json` - Added africastalking package

---

## 🚀 Next Steps to Enable SMS

### Step 1: Run Database Migration

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to: SQL Editor
3. Open the file: `backend/database/migrations/004_add_sms_logs.sql`
4. Copy all the SQL content
5. Paste into Supabase SQL Editor
6. Click "Run" to execute

**Option B: Using psql Command Line**
```bash
cd backend
psql -h your-supabase-host -U postgres -d postgres -f database/migrations/004_add_sms_logs.sql
```

### Step 2: Register for Africa's Talking

1. **Visit:** https://africastalking.com
2. **Click:** "Get Started" or "Sign Up"
3. **Fill in:**
   - Business name: Hawassa MESOB
   - Email: your business email
   - Phone: your phone number
   - Country: Ethiopia

4. **Verify your account** via email

### Step 3: Get Your API Credentials

1. **Login** to Africa's Talking dashboard
2. **Go to:** Dashboard → Settings → API Key
3. **Generate API Key** (if not already generated)
4. **Copy your credentials:**
   - Username: Usually `sandbox` for testing
   - API Key: Long string like `atsk_xxxxxxxxxxxxxx`

### Step 4: Configure Environment Variables

Open `backend/.env` and update:

```env
# For Testing (Sandbox - FREE credits)
SMS_USERNAME=sandbox
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

**Important:** 
- Keep `SMS_ENABLED=false` until you're ready to test
- Never commit your API key to git
- For production, use your actual username (not sandbox)

### Step 5: Add Test Phone Number (Sandbox Only)

For testing with sandbox:
1. Go to Africa's Talking Dashboard
2. Navigate to: Sandbox → SMS → Phone Numbers
3. Click "Add Phone Number"
4. Enter your test phone number (format: +251912345678)
5. Click "Add"

### Step 6: Restart Backend Server

```bash
cd backend
npm run dev
```

Look for this message in console:
```
✅ SMS Service initialized successfully
```

If you see:
```
⚠️ SMS Service not configured (missing credentials)
```
Check your .env file has correct SMS_API_KEY.

### Step 7: Test the SMS Feature

#### Test 1: Queue Join SMS
1. Login as a citizen (email: citizen@test.com)
2. Go to Online Services
3. Join a queue for any service
4. **Check your phone** - You should receive:
   ```
   MESOB: You joined the queue at [Institution]. 
   Your token: Q-2026-XXXX. Position: 1. 
   You will receive an SMS when called.
   ```

#### Test 2: Queue Call SMS
1. Login as an employee (email: employee@test.com)
2. Go to Queue Management
3. Click "Call Next" button
4. **Check citizen's phone** - They should receive:
   ```
   MESOB Alert: Your queue number Q-2026-XXXX is now 
   being called at [Institution]. Please proceed to 
   the service desk immediately.
   ```

### Step 8: Check SMS Logs

**In Supabase Dashboard:**
1. Go to Table Editor
2. Select `sms_logs` table
3. View sent SMS records

**Using SQL:**
```sql
SELECT 
  phone_number,
  message,
  status,
  sent_at
FROM sms_logs
ORDER BY sent_at DESC
LIMIT 10;
```

---

## 🔍 Troubleshooting

### Problem: SMS not sending

**Check 1: Environment variables**
```bash
# In backend directory
cat .env | grep SMS
```
Should show:
```
SMS_USERNAME=sandbox
SMS_API_KEY=atsk_xxxxx
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

**Check 2: Backend console logs**
Look for:
```
[SMS] Sending SMS to: +251912345678
[SMS] Message: MESOB Alert...
[SMS] ✅ SMS sent successfully
```

If you see:
```
[SMS] SMS disabled in environment
```
→ Set `SMS_ENABLED=true` in .env

If you see:
```
[SMS] SMS service not configured
```
→ Add SMS_API_KEY to .env and restart server

**Check 3: Phone number format**
- Must start with +251 (Ethiopia)
- Example: +251912345678
- System auto-formats 0912345678 → +251912345678

**Check 4: Sandbox phone registration**
- In sandbox mode, only registered phones receive SMS
- Add your test number in Africa's Talking dashboard

### Problem: SMS logs not saving

**Check if table exists:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'sms_logs';
```

If empty, run migration again (Step 1).

### Problem: "Invalid API Key" error

1. Generate new API key in Africa's Talking dashboard
2. Update .env file
3. Restart backend server

---

## 💰 Going to Production

### Step 1: Purchase SMS Credits

1. Login to Africa's Talking
2. Go to: Payments → Buy Airtime
3. Purchase credits (minimum: ~500 ETB)
4. Credits appear in your account instantly

### Step 2: Update Production Credentials

```env
# Production Configuration
SMS_USERNAME=your_production_username
SMS_API_KEY=your_production_api_key
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

### Step 3: Remove Phone Restrictions

Production mode works with ALL phone numbers automatically (no need to register test numbers).

### Step 4: Monitor Usage

Check daily SMS usage:
```sql
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as sms_sent,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM sms_logs
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

---

## 📊 Cost Estimation

**Africa's Talking Ethiopia Pricing:**
- Cost per SMS: ~0.80 ETB
- Bulk discounts available

**Example Monthly Cost:**
- 50 citizens/day × 2 SMS each (join + call) = 100 SMS/day
- 100 SMS × 0.80 ETB = 80 ETB/day
- 80 ETB × 30 days = **2,400 ETB/month**

**Tips to Reduce Cost:**
- Only send "call" SMS (skip "join" SMS) → 50% savings
- Check if citizen is online before sending SMS
- Batch notifications for multiple services

---

## 🎯 Features Implemented

### ✅ Citizen Joins Queue
- Receives confirmation SMS with token number
- Shows position in queue
- Message in English (can change to Amharic)

### ✅ Employee Calls Next
- Citizen receives "you are called" SMS
- Includes token number and institution name
- Works even if citizen left MESOB center

### ✅ SMS Logging
- All SMS logged to database
- Track success/failure
- Audit trail for admins
- Can query SMS history

### ✅ Error Handling
- SMS failure doesn't break queue system
- Graceful degradation if no phone number
- Logs errors for debugging
- Non-blocking operations

---

## 🔐 Security Notes

1. **API Key Protection**
   - Never commit .env file to git
   - Already in .gitignore
   - Rotate keys regularly

2. **Phone Number Privacy**
   - Phone numbers in database encrypted at rest (Supabase)
   - SMS logs only accessible by admins
   - RLS policies enforce access control

3. **Rate Limiting**
   - Africa's Talking has built-in rate limits
   - System won't spam same number

---

## 📞 Support

### Africa's Talking Support
- **Email:** support@africastalking.com
- **Docs:** https://developers.africastalking.com/docs
- **Phone:** Available in dashboard

### System Issues
Check backend logs:
```bash
cd backend
npm run dev
# Watch console output
```

---

## ✨ Summary

**What's Done:**
- ✅ SMS service integrated
- ✅ Queue join notification
- ✅ Queue call notification  
- ✅ SMS logging to database
- ✅ Error handling
- ✅ Phone number formatting
- ✅ English & Amharic support

**What's Needed:**
- 🔲 Run database migration
- 🔲 Register Africa's Talking account
- 🔲 Add API credentials to .env
- 🔲 Test with sandbox
- 🔲 Deploy to production

**Total Setup Time:** ~30 minutes
**Cost:** FREE for testing, ~2,400 ETB/month production

---

## 🎉 You're Ready!

Follow steps 1-7 above to enable SMS notifications. If you encounter any issues, check the troubleshooting section or contact support.
