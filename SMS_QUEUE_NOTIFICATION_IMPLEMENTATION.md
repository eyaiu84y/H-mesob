# SMS Queue Notification Implementation Guide

## 📋 Overview
Add SMS notifications to inform citizens when their queue number is called, ensuring accessibility for customers without smartphones.

## 🎯 Requirements
- Send SMS when employee calls next person in queue (status changes to IN_PROGRESS)
- Support for non-smartphone users
- No changes to existing database schema (phone field already exists in users table)
- Low-cost SMS provider integration

---

## 📝 Implementation Steps

### Step 1: Choose SMS Provider

**Recommended: Africa's Talking** (Best for Ethiopia)
- Cost: ~0.80 ETB per SMS
- Ethiopia coverage: Excellent
- Sign up: https://africastalking.com

**Alternative: Twilio**
- Cost: ~$0.05 USD per SMS
- Global coverage
- Sign up: https://twilio.com

**For this guide, we'll use Africa's Talking**

### Step 2: Register and Get API Credentials

1. **Create Account**
   - Visit: https://africastalking.com
   - Register with business email
   - Verify your account

2. **Get Credentials**
   - Go to Dashboard → Settings → API Key
   - Copy your:
     - `Username` (usually "sandbox" for testing)
     - `API Key`

3. **Add Test Credit**
   - For testing, Africa's Talking provides free sandbox credit
   - Production: Purchase bulk SMS credits

### Step 3: Install SMS Package

```bash
cd backend
npm install africastalking
```

### Step 4: Update Environment Variables

Add to `backend/.env`:

```env
# SMS Configuration (Africa's Talking)
SMS_USERNAME=sandbox
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

### Step 5: Create SMS Service

Create new file: `backend/src/services/smsService.js`

```javascript
import AfricasTalking from 'africastalking';

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.SMS_API_KEY,
  username: process.env.SMS_USERNAME,
});

const sms = africastalking.SMS;

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number (format: +251912345678)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} SMS send result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if SMS is enabled
    if (process.env.SMS_ENABLED !== 'true') {
      console.log('[SMS] SMS disabled in environment');
      return {
        success: false,
        message: 'SMS notifications are disabled',
      };
    }

    // Validate phone number
    if (!phoneNumber) {
      console.error('[SMS] No phone number provided');
      return {
        success: false,
        message: 'Phone number is required',
      };
    }

    // Format phone number (ensure it starts with +251 for Ethiopia)
    let formattedPhone = phoneNumber.trim();
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/[\s-]/g, '');
    
    // Add country code if not present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+251' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+251' + formattedPhone;
    }

    console.log('[SMS] Sending SMS to:', formattedPhone);
    console.log('[SMS] Message:', message);

    // Send SMS
    const result = await sms.send({
      to: [formattedPhone],
      message: message,
      from: process.env.SMS_SENDER_ID || 'MESOB',
    });

    console.log('[SMS] Send result:', result);

    // Check if SMS was sent successfully
    if (result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success') {
        console.log('[SMS] ✅ SMS sent successfully');
        return {
          success: true,
          message: 'SMS sent successfully',
          data: result,
        };
      } else {
        console.error('[SMS] ❌ SMS failed:', recipient.status);
        return {
          success: false,
          message: `SMS failed: ${recipient.status}`,
          data: result,
        };
      }
    }

    return {
      success: false,
      message: 'No recipients processed',
      data: result,
    };

  } catch (error) {
    console.error('[SMS] Error sending SMS:', error);
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
      error: error,
    };
  }
};

/**
 * Send queue call notification via SMS
 * @param {string} phoneNumber - Citizen phone number
 * @param {string} queueNumber - Queue token number
 * @param {string} institutionName - Institution name
 * @param {string} language - Language code ('en' or 'am')
 * @returns {Promise<Object>} SMS send result
 */
export const sendQueueCallSMS = async (
  phoneNumber,
  queueNumber,
  institutionName,
  language = 'en'
) => {
  try {
    // SMS message templates
    const messages = {
      en: `MESOB Alert: Your queue number ${queueNumber} is now being called at ${institutionName}. Please proceed to the service desk immediately.`,
      am: `MESOB ማሳወቂያ: የእርስዎ የመስመር ቁጥር ${queueNumber} በ${institutionName} አሁን እየተጠራ ነው። እባክዎን ወዲያውኑ ወደ አገልግሎት ጠረጴዛ ይምጡ።`,
    };

    const message = messages[language] || messages.en;

    return await sendSMS(phoneNumber, message);

  } catch (error) {
    console.error('[SMS] Error sending queue call SMS:', error);
    return {
      success: false,
      message: 'Failed to send queue notification',
    };
  }
};

/**
 * Log SMS notification to database for audit
 */
export const logSMSNotification = async (supabase, userId, phoneNumber, message, status) => {
  try {
    await supabase
      .from('sms_logs')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        message: message,
        status: status,
        sent_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('[SMS] Failed to log SMS:', error);
    // Don't throw - logging failure shouldn't block SMS sending
  }
};
```

### Step 6: Create SMS Logs Table (Optional but Recommended)

Create new file: `backend/database/migrations/004_add_sms_logs.sql`

```sql
-- ============================================================================
-- SMS Logs Table
-- Description: Track all SMS notifications sent by the system
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'PENDING'
  provider_response JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

-- RLS Policies
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view SMS logs
DROP POLICY IF EXISTS "admin_view_sms_logs" ON sms_logs;
CREATE POLICY "admin_view_sms_logs" ON sms_logs
  FOR SELECT
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'MESOB_MANAGER')
  );
```

**Run this migration:**
```bash
# Connect to Supabase and run the SQL in SQL Editor
```

### Step 7: Update Queue Service to Send SMS

Modify `backend/src/services/queueService.js`:

```javascript
// Add import at top of file
import { sendQueueCallSMS, logSMSNotification } from './smsService.js';

// In the callNext function, after updating queue status:
// Find this section (around line 500):

    // Notify citizen (don't let this block success)
    try {
      await createNotification({
        userId: queue.citizen_id,
        type: 'QUEUE_ASSIGNMENT',
        title: 'Your Turn in Queue',
        message: `Token ${queue.queue_number} - Please proceed to the service desk`,
        relatedEntityId: queue.id,
        relatedEntityType: 'queue'
      });
      console.log('✅ Notification sent to citizen');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification (non-critical):', notifError);
    }

// ADD THIS NEW SECTION RIGHT AFTER THE NOTIFICATION:

    // Send SMS notification (don't let this block success)
    try {
      // Fetch citizen phone number
      const { data: citizen, error: citizenError } = await supabase
        .from('users')
        .select('phone, full_name')
        .eq('id', queue.citizen_id)
        .single();

      if (!citizenError && citizen && citizen.phone) {
        // Fetch institution name
        const { data: institution } = await supabase
          .from('institutions')
          .select('name_en, name_am')
          .eq('id', queue.institution_id)
          .single();

        const institutionName = institution?.name_en || 'MESOB Center';

        // Send SMS (try both English and Amharic)
        const smsResult = await sendQueueCallSMS(
          citizen.phone,
          queue.queue_number,
          institutionName,
          'en' // or 'am' for Amharic
        );

        // Log SMS attempt
        await logSMSNotification(
          supabase,
          queue.citizen_id,
          citizen.phone,
          `Queue ${queue.queue_number} called`,
          smsResult.success ? 'SUCCESS' : 'FAILED'
        );

        if (smsResult.success) {
          console.log('✅ SMS sent to citizen:', citizen.phone);
        } else {
          console.log('⚠️ SMS failed (non-critical):', smsResult.message);
        }
      } else {
        console.log('⚠️ No phone number for citizen (SMS skipped)');
      }
    } catch (smsError) {
      console.error('⚠️ Failed to send SMS (non-critical):', smsError);
    }
```

### Step 8: Test the Implementation

#### Test in Sandbox Mode:

1. **Update .env with sandbox credentials:**
```env
SMS_USERNAME=sandbox
SMS_API_KEY=your_sandbox_api_key
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

2. **Add test phone number in Africa's Talking dashboard:**
   - Go to Sandbox → Phone Numbers
   - Add your test phone number

3. **Restart backend server:**
```bash
cd backend
npm run dev
```

4. **Test the flow:**
   - Login as a citizen
   - Join a queue for a service
   - Login as an employee
   - Call the next person in queue
   - Check if SMS is received on test phone

5. **Check logs:**
```bash
# Backend console will show:
[SMS] Sending SMS to: +251912345678
[SMS] Message: MESOB Alert: Your queue number Q-2026-0001...
[SMS] ✅ SMS sent successfully
```

### Step 9: Production Deployment

1. **Purchase SMS credits** from Africa's Talking

2. **Update production environment:**
```env
SMS_USERNAME=your_production_username
SMS_API_KEY=your_production_api_key
SMS_SENDER_ID=MESOB
SMS_ENABLED=true
```

3. **Test with real phone numbers**

4. **Monitor SMS logs** in database

---

## 💰 Cost Estimation

### Africa's Talking Ethiopia:
- Cost per SMS: ~0.80 ETB
- If 100 citizens/day: 80 ETB/day = 2,400 ETB/month
- Bulk purchase discounts available

### Optimization Tips:
- Only send SMS for IN_PROGRESS status
- Don't send SMS if citizen is logged in (they see notification)
- Set SMS_ENABLED=false to disable if needed

---

## 🔒 Security Considerations

1. **Phone Number Privacy**
   - Don't log full phone numbers in plain text logs
   - Mask phone numbers in application logs

2. **Rate Limiting**
   - Prevent SMS spam attacks
   - Limit SMS per user per day

3. **API Key Security**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

---

## 📊 Monitoring

### Check SMS Logs:
```sql
-- Recent SMS sent
SELECT 
  user_id,
  phone_number,
  message,
  status,
  sent_at
FROM sms_logs
ORDER BY sent_at DESC
LIMIT 50;

-- SMS success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM sms_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

---

## 🎨 User Experience

### Citizen Perspective:
1. **Join Queue** → Receive confirmation SMS
2. **Wait** → Can leave MESOB center
3. **Your turn** → Receive "You are called" SMS
4. **Return** → Get served immediately

### Message Examples:

**English:**
```
MESOB Alert: Your queue number Q-2026-0023 is now being called at Revenue Office. Please proceed to the service desk immediately.
```

**Amharic:**
```
MESOB ማሳወቂያ: የእርስዎ የመስመር ቁጥር Q-2026-0023 በገቢ ጽ/ቤት አሁን እየተጠራ ነው። እባክዎን ወዲያውኑ ወደ አገልግሎት ጠረጴዛ ይምጡ።
```

---

## ✅ Testing Checklist

- [ ] SMS service installed (`npm install africastalking`)
- [ ] Environment variables configured
- [ ] SMS service file created
- [ ] Queue service updated to send SMS
- [ ] SMS logs table created (optional)
- [ ] Test SMS sent successfully in sandbox
- [ ] Phone number formatting works correctly
- [ ] SMS received on test device
- [ ] Amharic characters display correctly
- [ ] Error handling tested (invalid phone number)
- [ ] Production credentials configured
- [ ] Monitoring dashboard set up

---

## 🚀 Future Enhancements

1. **SMS Preferences**
   - Let users opt-in/opt-out of SMS notifications
   - Choose notification language preference

2. **Additional SMS Notifications**
   - Application status updates
   - Appointment reminders
   - Service completion confirmations

3. **Two-Way SMS**
   - Allow users to reply to SMS
   - Check queue position via SMS
   - Cancel queue via SMS

4. **SMS Templates**
   - Create reusable SMS templates
   - Multi-language support
   - Dynamic content insertion

---

## 📞 Support

**Africa's Talking Support:**
- Email: support@africastalking.com
- Docs: https://developers.africastalking.com/docs/sms/overview

**MESOB System Support:**
- Check backend logs: `backend/logs/`
- Check SMS logs table in database
- Monitor SMS delivery status

---

## 📝 Summary

This implementation:
- ✅ Works without changing database schema
- ✅ Supports non-smartphone users
- ✅ Low cost (~0.80 ETB per SMS)
- ✅ Easy to test with sandbox
- ✅ Production ready
- ✅ Supports Amharic language
- ✅ Includes error handling
- ✅ Non-blocking (won't crash if SMS fails)

**Total implementation time: ~2-3 hours**
