# 🏗️ Telegram Bot Integration - Architecture Diagram

**Date:** August 24, 2026

---

## 📊 HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        TELEGRAM BOT                              │
│                   (To be implemented)                            │
│                                                                  │
│  Commands: /start, /search, /queue, /applications, etc.        │
│  Handlers: text messages, buttons, inline queries               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (with JWT token)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   EXISTING BACKEND API                           │
│                  http://localhost:5000/api                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AUTHENTICATION MIDDLEWARE                               │   │
│  │  - Verify JWT token                                      │   │
│  │  - Fetch user from database                              │   │
│  │  - Check user status (ACTIVE)                            │   │
│  │  - Attach user to request (req.user)                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  ROUTES (12 modules)                                      │ │
│  │  /api/auth, /api/queues, /api/applications,              │ │
│  │  /api/maintenance, /api/announcements, /api/notifications│ │
│  │  /api/services, /api/institutions, /api/search, etc.     │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  CONTROLLERS (Request Handlers)                          │ │
│  │  - Validate input                                        │ │
│  │  - Call business logic                                   │ │
│  │  - Format response                                       │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  SERVICES (Business Logic) ✅ REUSABLE BY TELEGRAM       │ │
│  │  - authService.js                                        │ │
│  │  - queueService.js                                       │ │
│  │  - applicationService.js                                 │ │
│  │  - notificationService.js                                │ │
│  │  - announcementService.js                                │ │
│  │  - searchService.js                                      │ │
│  │  - institutionService.js, serviceService.js, etc.        │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                            │
                            │ Supabase Client
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   SUPABASE DATABASE (PostgreSQL)                 │
│                                                                  │
│  TABLES (14):                                                    │
│  ✅ users                                                        │
│  ✅ institutions (12 active)                                     │
│  ✅ services (41 active)                                         │
│  ✅ service_requirements                                         │
│  ✅ applications                                                 │
│  ✅ queue_entries                                                │
│  ✅ maintenance_reports, maintenance_tasks                       │
│  ✅ announcements                                                │
│  ✅ notifications                                                │
│  ✅ telegram_users ⭐ (ALREADY EXISTS)                           │
│  ✅ audit_logs                                                   │
│  ✅ user_sessions, failed_login_attempts                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔗 TELEGRAM ACCOUNT LINKING FLOW

```
┌────────────────┐
│  Telegram User │
└───────┬────────┘
        │
        │ 1. Sends /start
        ▼
┌────────────────┐
│  Telegram Bot  │
└───────┬────────┘
        │
        │ 2. Generates 6-digit code (e.g., 123456)
        │    Saves to temporary storage (Redis/memory)
        │    Expiry: 10 minutes
        │
        │ 3. Responds: "Visit app.mesob.com/link and enter code: 123456"
        ▼
┌────────────────┐
│  Telegram User │
└───────┬────────┘
        │
        │ 4. Opens web app
        ▼
┌────────────────┐
│   Web App      │
│  (Frontend)    │
└───────┬────────┘
        │
        │ 5. User logs in (email + password)
        │
        │ 6. User enters linking code: 123456
        │
        │ 7. POST /api/telegram/link
        │    { code: "123456", telegram_chat_id: 123456789 }
        │    Authorization: Bearer {jwt_token}
        ▼
┌────────────────┐
│   Backend API  │
└───────┬────────┘
        │
        │ 8. Verifies JWT token → gets user_id
        │
        │ 9. Verifies linking code (not expired)
        │
        │ 10. Creates telegram_users record:
        │     {
        │       user_id: "uuid",
        │       telegram_chat_id: 123456789,
        │       telegram_username: "john_doe",
        │       notifications_enabled: true,
        │       language: "en",
        │       is_active: true,
        │       linked_at: "2026-08-24T10:30:00Z"
        │     }
        │
        │ 11. Deletes linking code
        │
        │ 12. Sends success response
        ▼
┌────────────────┐
│   Web App      │
└───────┬────────┘
        │
        │ 13. Displays: "✅ Account linked successfully!"
        ▼
┌────────────────┐
│  Telegram Bot  │
└───────┬────────┘
        │
        │ 14. Detects new telegram_users record
        │
        │ 15. Sends confirmation: "✅ Account linked! You can now use bot commands."
        ▼
┌────────────────┐
│  Telegram User │
└────────────────┘
```

---

## 🔄 TELEGRAM BOT COMMAND FLOW

### Example: `/queue` command

```
┌────────────────┐
│  Telegram User │
└───────┬────────┘
        │
        │ 1. Sends /queue
        ▼
┌────────────────┐
│  Telegram Bot  │
└───────┬────────┘
        │
        │ 2. Gets telegram_chat_id (123456789)
        │
        │ 3. Query telegram_users table:
        │    SELECT user_id FROM telegram_users
        │    WHERE telegram_chat_id = 123456789 AND is_active = true
        │
        │ 4. Gets user_id (uuid)
        │
        │ 5. Query users table:
        │    SELECT * FROM users WHERE id = user_id
        │
        │ 6. Gets user object (email, role, institution_id, etc.)
        │
        │ 7. Calls queueService.getQueues(filters, user):
        │    - filters = { status: 'PENDING', user_id: user.id }
        │    - user = full user object
        │
        │ 8. queueService queries queue_entries table:
        │    SELECT * FROM queue_entries
        │    WHERE citizen_id = user.id AND status = 'PENDING'
        │    ORDER BY created_at DESC
        │
        │ 9. Returns queue list
        │
        │ 10. Formats response:
        │     "📋 Your Queues (2)
        │      
        │      1️⃣ Telecom - New SIM Card
        │         Status: Pending
        │         Position: #3
        │         Est. wait: 15 min
        │      
        │      2️⃣ CBE - New Bank Account
        │         Status: Pending
        │         Position: #7
        │         Est. wait: 35 min"
        │
        │ 11. Sends formatted message
        ▼
┌────────────────┐
│  Telegram User │
└────────────────┘
```

---

## 🔔 NOTIFICATION PUSH FLOW (Optional Enhancement)

```
┌────────────────┐
│   Backend API  │
│                │
│ Event occurs:  │
│ - Queue called │
│ - App updated  │
│ - Maintenance  │
└───────┬────────┘
        │
        │ 1. Business logic creates notification:
        │    INSERT INTO notifications (
        │      recipient_id, type, title, message
        │    )
        │
        │ 2. Notification created in database
        │
        │ 3. (Optional) Trigger notification service:
        │    notificationService.sendToPushChannels(notification)
        ▼
┌────────────────┐
│ Notification   │
│ Push Service   │
│ (To implement) │
└───────┬────────┘
        │
        │ 4. Query telegram_users:
        │    SELECT telegram_chat_id FROM telegram_users
        │    WHERE user_id = notification.recipient_id
        │      AND is_active = true
        │      AND notifications_enabled = true
        │
        │ 5. Gets telegram_chat_id
        │
        │ 6. Sends Telegram message:
        │    bot.sendMessage(telegram_chat_id, formatted_message)
        ▼
┌────────────────┐
│  Telegram User │
│                │
│ Receives:      │
│ 🔔 Your queue  │
│ position is    │
│ now #1! Please │
│ come to the    │
│ counter.       │
└────────────────┘
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT LAYER                        │
│  - Command handlers                                          │
│  - Message formatting                                        │
│  - User interaction                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP/HTTPS + JWT
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    API LAYER (Existing)                      │
│  - Authentication (JWT)                                      │
│  - Authorization (RBAC)                                      │
│  - Request validation                                        │
│  - Response formatting                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Function calls
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (Existing)                 │
│  ✅ All reusable by Telegram bot                            │
│  - Queue management                                          │
│  - Application tracking                                      │
│  - Notification system                                       │
│  - Announcement system                                       │
│  - Search functionality                                      │
│  - Service catalogue                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Supabase queries
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   DATA LAYER (Existing)                      │
│  - PostgreSQL (Supabase)                                     │
│  - 14 tables including telegram_users                        │
│  - Row-level security (RLS)                                  │
│  - Audit logging                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 TELEGRAM BOT COMMAND STRUCTURE

```
/start
├── Welcome message
├── Check if account is linked
│   ├── YES → Show main menu
│   └── NO → Generate linking code
│
/link
├── Generate one-time linking code
├── Display instructions
└── Wait for linking confirmation
│
/search [query]
├── Validate query (min 2 chars)
├── Call searchService.performSearch(query)
├── Display institutions + services
└── Inline buttons: "View Details", "Join Queue"
│
/queue
├── Get user's telegram_chat_id
├── Lookup user_id in telegram_users
├── Call queueService.getQueues(filters, user)
├── Display active queues
└── Inline buttons: "Check Status", "Cancel Queue"
│
/applications
├── Get user's telegram_chat_id
├── Lookup user_id in telegram_users
├── Call applicationService.getApplications(filters, user)
├── Display applications with status
└── Inline buttons: "View Details", "Track Status"
│
/notifications
├── Get user's telegram_chat_id
├── Lookup user_id in telegram_users
├── Call notificationService.getNotifications(user, filters)
├── Display unread notifications
└── Inline buttons: "Mark as Read", "View All"
│
/announcements
├── Call announcementService.getAnnouncements(filters, user)
├── Display public announcements
└── Inline buttons: "Read More"
│
/help
├── Display available commands
└── Display usage instructions
│
/settings
├── Display current preferences
└── Inline buttons: "Toggle Notifications", "Change Language", "Unlink Account"
```

---

## 🔐 SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT                              │
│  - Rate limiting (prevent spam)                              │
│  - Input validation                                          │
│  - Command authorization                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTPS only
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  AUTHENTICATION                              │
│  ✅ JWT token (24h expiry)                                  │
│  ✅ Token verification on every request                     │
│  ✅ User status check (must be ACTIVE)                      │
│  ✅ Failed login tracking                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  AUTHORIZATION                               │
│  ✅ Role-based access control (RBAC)                        │
│  ✅ 6 roles: SUPER_ADMIN, MESOB_MANAGER,                   │
│      INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF, CITIZEN      │
│  ✅ authorize(...roles) middleware                          │
│  ✅ Institution scope checking                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  DATABASE SECURITY                           │
│  ✅ Row-level security (RLS) on all tables                  │
│  ✅ Service role policies                                   │
│  ✅ User-specific policies                                  │
│  ✅ Audit logging for all critical actions                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 TELEGRAM BOT USER EXPERIENCE

```
User opens Telegram → Searches for "Hawassa MESOB Bot"
   ↓
Sends /start
   ↓
Bot: "Welcome to Hawassa MESOB! 👋
      
      To use this bot, you need to link your account.
      
      1. Visit: app.mesob.com/link
      2. Login with your email and password
      3. Enter this code: 123456
      
      Code expires in 10 minutes."
   ↓
User visits web app, logs in, enters code
   ↓
Bot: "✅ Account linked successfully!
      
      You can now use these commands:
      /search - Search services
      /queue - View your queues
      /applications - Track applications
      /notifications - View notifications
      /help - Get help"
   ↓
User sends /search bank
   ↓
Bot: "🔍 Search Results for 'bank':
      
      🏢 Institutions (2):
      1. Commercial Bank of Ethiopia
      2. Sidama Bank
      
      📋 Services (4):
      1. New Bank Account (CBE)
      2. Mobile Banking (CBE)
      3. Postal Banking (Ethiopost)
      4. Mobile Banking (Sidama Bank)
      
      [View Details] [Join Queue]"
   ↓
User clicks "Join Queue" for "New Bank Account"
   ↓
Bot: "✅ You've joined the queue!
      
      Service: New Bank Account
      Institution: Commercial Bank of Ethiopia
      Queue Number: #12
      Estimated Wait: 40 minutes
      
      You'll receive a notification when it's your turn.
      
      [Check Status] [Cancel Queue]"
```

---

## ✅ INTEGRATION CHECKLIST

### Phase 1: Setup (Day 1)
- [ ] Install `node-telegram-bot-api` package
- [ ] Create bot on Telegram (get bot token)
- [ ] Add `TELEGRAM_BOT_TOKEN` to `.env`
- [ ] Create `src/bot/index.js` (bot entry point)
- [ ] Test bot connection

### Phase 2: Account Linking (Day 2)
- [ ] Create `src/services/telegramService.js`
- [ ] Implement linking code generation
- [ ] Implement linking code verification
- [ ] Create `telegram_users` CRUD functions
- [ ] Create `/api/telegram/link` endpoint
- [ ] Test account linking flow

### Phase 3: Core Commands (Days 3-4)
- [ ] Implement `/start` command
- [ ] Implement `/link` command
- [ ] Implement `/search` command
- [ ] Implement `/queue` command
- [ ] Implement `/applications` command
- [ ] Implement `/notifications` command
- [ ] Implement `/announcements` command
- [ ] Implement `/help` command
- [ ] Implement `/settings` command

### Phase 4: Inline Features (Day 5)
- [ ] Implement inline keyboards (buttons)
- [ ] Implement callback query handlers
- [ ] Implement queue status checking
- [ ] Implement application tracking
- [ ] Implement notification marking

### Phase 5: Testing & Refinement (Days 6-7)
- [ ] Test all commands with sample users
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Test notification push (if implemented)
- [ ] User acceptance testing
- [ ] Documentation

---

**Architecture Documented:** August 24, 2026  
**By:** Kiro AI  
**Status:** Ready for implementation
