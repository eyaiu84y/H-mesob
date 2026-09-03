# Telegram Feedback Integration Guide

## Overview
Complete integration guide for triggering feedback prompts via Telegram bot after service completion.

## ✅ Completed Components

### 1. Backend Feedback Handler (`backend/src/bot/handlers/feedbackHandler.js`)
- ✅ `promptForFeedback()` - Shows 5-star rating keyboard after service completion
- ✅ `handleFeedbackRating()` - Processes rating selection, submits to database
- ✅ Dynamic success message: "You rated our service {X}/5 Stars"
- ✅ Duplicate prevention - checks if citizen already rated
- ✅ Bilingual support (English/Amharic)
- ✅ Source tracking: saves with `source: 'TELEGRAM'`

### 2. Telegram Keyboards (`backend/src/bot/config/keyboards.js`)
- ✅ `getFeedbackRatingKeyboard()` - 5-star inline keyboard
- ✅ Rating meanings displayed: Poor, Good, Very Good, Excellent, Fantastic
- ✅ Callback data: `feedback_1` through `feedback_5`
- ✅ Bilingual labels

### 3. Callback Handler (`backend/src/bot/handlers/callbackHandler.js`)
- ✅ Import `handleFeedbackRating` from feedbackHandler
- ✅ Route `feedback_*` callbacks to feedback handler
- ✅ Integrated into main callback router

## 🔧 Integration Points

### When to Trigger Feedback Prompt

Feedback should be requested after:

1. **Application Completed** - When application status changes to "Completed"
2. **Queue Service Completed** - When citizen's queue service is finished
3. **Maintenance Request Resolved** - When maintenance request is closed

### How to Trigger

```javascript
import { promptForFeedback } from './handlers/feedbackHandler.js';

// After service completion, call:
await promptForFeedback(bot, chatId, {
  institution_id: 'uuid',
  service_id: 'uuid',
  institution_name: 'Example Institution',
  service_name: 'Birth Certificate',
  application_id: 'uuid',  // OR
  queue_entry_id: 'uuid'   // One of these must be provided
}, userLanguage);
```

## 📍 Where to Add Triggers

### Option 1: Database Triggers (Recommended)
Create PostgreSQL triggers that notify Telegram bot when:
- `applications.status` changes to 'Completed'
- `queue_entries.status` changes to 'Completed'
- `maintenance_requests.status` changes to 'Resolved'

**File to create:** `backend/database/migrations/006_feedback_notification_triggers.sql`

```sql
-- Function to notify bot of completion
CREATE OR REPLACE FUNCTION notify_telegram_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify via pg_notify (bot listens)
  PERFORM pg_notify(
    'service_completed',
    json_build_object(
      'citizen_id', NEW.citizen_id,
      'institution_id', NEW.institution_id,
      'service_id', NEW.service_id,
      'application_id', NEW.id,
      'type', TG_TABLE_NAME
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on application completion
CREATE TRIGGER application_completed_feedback
AFTER UPDATE OF status ON applications
FOR EACH ROW
WHEN (NEW.status = 'Completed' AND OLD.status != 'Completed')
EXECUTE FUNCTION notify_telegram_feedback();

-- Trigger on queue completion
CREATE TRIGGER queue_completed_feedback
AFTER UPDATE OF status ON queue_entries
FOR EACH ROW
WHEN (NEW.status = 'Completed' AND OLD.status != 'Completed')
EXECUTE FUNCTION notify_telegram_feedback();
```

**Bot listener:** `backend/src/bot/services/feedbackTriggerService.js`

```javascript
import { supabase } from '../../config/supabase.js';
import { promptForFeedback } from '../handlers/feedbackHandler.js';

export async function setupFeedbackTriggers(bot) {
  const subscription = supabase
    .channel('service_completions')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'applications',
      filter: 'status=eq.Completed'
    }, async (payload) => {
      const { citizen_id, institution_id, service_id, id } = payload.new;
      
      // Get telegram_chat_id
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('telegram_chat_id, language')
        .eq('user_id', citizen_id)
        .single();
      
      if (telegramUser) {
        // Get institution and service names
        const { data: institution } = await supabase
          .from('institutions')
          .select('name')
          .eq('id', institution_id)
          .single();
        
        const { data: service } = await supabase
          .from('services')
          .select('name')
          .eq('id', service_id)
          .single();
        
        await promptForFeedback(bot, telegramUser.telegram_chat_id, {
          institution_id,
          service_id,
          institution_name: institution?.name || 'Unknown',
          service_name: service?.name || 'Unknown',
          application_id: id
        }, telegramUser.language || 'en');
      }
    })
    .subscribe();
  
  console.log('✅ Feedback triggers set up');
}
```

### Option 2: Application Service Hook
Modify application completion logic to trigger feedback.

**File:** `backend/src/services/applicationService.js`

Add after status update to 'Completed':

```javascript
// After application status updated to Completed
if (status === 'Completed') {
  // Trigger Telegram feedback
  const { data: telegramUser } = await supabase
    .from('telegram_users')
    .select('telegram_chat_id, language')
    .eq('user_id', application.citizen_id)
    .single();
  
  if (telegramUser && global.telegramBot) {
    const { promptForFeedback } = await import('../bot/handlers/feedbackHandler.js');
    
    await promptForFeedback(global.telegramBot, telegramUser.telegram_chat_id, {
      institution_id: application.institution_id,
      service_id: application.service_id,
      institution_name: institution.name,
      service_name: service.name,
      application_id: application.id
    }, telegramUser.language || 'en');
  }
}
```

### Option 3: Manual Testing Command
Add test command for immediate testing without waiting for real completions.

**File:** `backend/src/bot/commands/testFeedback.js`

```javascript
export async function handleTestFeedback(bot, msg) {
  const chatId = msg.chat.id;
  
  // Mock service data for testing
  await promptForFeedback(bot, chatId, {
    institution_id: 'test-institution-id',
    service_id: 'test-service-id',
    institution_name: 'Test Institution',
    service_name: 'Test Service',
    application_id: 'test-application-id'
  }, 'en');
}
```

Register in `backend/src/bot/commands/index.js`:
```javascript
bot.onText(/\/testfeedback/, (msg) => handleTestFeedback(bot, msg));
```

## 🔄 Complete Flow

1. **Service Completed** → Status changes in database
2. **Trigger Fires** → Bot detects completion via realtime subscription or service hook
3. **Lookup Telegram User** → Find `telegram_chat_id` from `telegram_users` table
4. **Send Feedback Prompt** → `promptForFeedback()` sends 5-star keyboard
5. **User Selects Rating** → Clicks inline button (e.g., `feedback_4`)
6. **Callback Handler** → Routes to `handleFeedbackRating()`
7. **Submit to Database** → Calls `feedbackService.submitFeedback()` with `source: 'TELEGRAM'`
8. **Success Message** → "You rated our service 4/5 Stars ⭐⭐⭐⭐"
9. **Appears in Dashboards** → Managers see feedback with source label

## 🧪 Testing Steps

### 1. Test Callback Routing (Unit Test)
```bash
# In bot directory
node -e "
import { handleFeedbackRating } from './src/bot/handlers/feedbackHandler.js';
console.log('✅ Feedback handler imported successfully');
"
```

### 2. Test Manual Trigger
```bash
# Add /testfeedback command, run bot
# In Telegram: /testfeedback
# Expected: 5-star rating keyboard appears
```

### 3. Test Rating Submission
```bash
# Click any rating button
# Expected: "You rated our service X/5 Stars" message
# Check database: SELECT * FROM service_feedback WHERE source = 'TELEGRAM';
```

### 4. Test Duplicate Prevention
```bash
# Click rating again on same service
# Expected: "⚠️ You have already rated this service"
```

### 5. Test Dashboard Integration
```bash
# Login to Institution Manager dashboard → Service Feedback
# Expected: Telegram feedback visible with "Telegram" source badge
# Login to MESOB Manager dashboard → Feedback Overview
# Expected: Telegram feedback in overall statistics
```

## 📊 Database Verification

```sql
-- Check feedback records
SELECT 
  f.*,
  u.full_name as citizen_name,
  i.name as institution_name,
  s.name as service_name
FROM service_feedback f
JOIN users u ON f.citizen_id = u.id
JOIN institutions i ON f.institution_id = i.id
JOIN services s ON f.service_id = s.id
WHERE f.source = 'TELEGRAM'
ORDER BY f.created_at DESC;

-- Check rating distribution
SELECT 
  rating,
  COUNT(*) as count,
  source
FROM service_feedback
GROUP BY rating, source
ORDER BY rating DESC;
```

## 🚨 Common Issues

### Issue: "Session expired" error
**Cause:** User state cleared or bot restarted
**Fix:** Ensure `userService.js` maintains state or use database-backed state

### Issue: "Please link your account first"
**Cause:** No record in `telegram_users` table
**Fix:** Ensure user completes /start and account linking flow first

### Issue: Feedback not appearing in dashboard
**Cause:** RLS policies or incorrect institution_id
**Fix:** Verify RLS policies allow institution managers to see feedback
```sql
-- Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'service_feedback';
```

### Issue: Rating not dynamic (shows "3/5" for all)
**Cause:** Hard-coded string in success message
**Fix:** Use template literal: `` `${rating}/5 Stars` ``

## ✅ Integration Checklist

- [x] feedbackHandler.js created
- [x] getFeedbackRatingKeyboard() added to keyboards.js
- [x] handleFeedbackRating() integrated in callbackHandler.js
- [ ] Choose trigger method (database trigger OR service hook)
- [ ] Implement chosen trigger
- [ ] Test /testfeedback command
- [ ] Test rating submission
- [ ] Test duplicate prevention
- [ ] Verify dashboard shows Telegram feedback
- [ ] Test bilingual (English + Amharic)
- [ ] Run migration: 004_create_feedback_table.sql
- [ ] Run migration: 005_feedback_rls_policies.sql
- [ ] Production deployment

## 🎯 Next Steps

1. **Choose trigger method** - Realtime subscription (recommended) or service hook
2. **Implement trigger** - Add feedback prompt call after service completion
3. **Test end-to-end** - Complete service → receive prompt → submit rating → verify in dashboard
4. **Document for team** - Update README with Telegram feedback feature

## 📝 Notes

- Feedback is **optional** - citizens can ignore the prompt
- **One rating per service** - enforced by unique constraint in database
- **Bilingual** - All messages support English and Amharic
- **Source tracking** - Website and Telegram feedback clearly labeled
- **Real-time stats** - Manager dashboards calculate statistics on-the-fly
