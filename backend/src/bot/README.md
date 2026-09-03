# Hawassa MESOB Telegram Bot

Foundation implementation of the Telegram bot for Hawassa MESOB Public Service Information System.

## Architecture

```
Telegram Bot → Existing Backend API → Existing Database
```

**IMPORTANT:** This bot uses the existing backend business logic. It does NOT duplicate functionality.

## Features Implemented (Foundation)

✅ Bot startup and connection  
✅ /start command with welcome message  
✅ Language selection (English/Amharic)  
✅ /menu command with main menu  
✅ /help command  
✅ Inline keyboard navigation  
✅ Back and Cancel buttons  
✅ Error handling (user-friendly messages)  
✅ Graceful shutdown  
✅ User state management  
✅ Integration with existing telegram_users table  

## Not Yet Implemented

The following features are planned but not implemented in this foundation:

- Account linking workflow
- Service requirements browsing
- Queue management
- Application tracking
- Maintenance reporting
- Task assignment (RBAC-enforced)
- Announcements & notifications
- Full backend API integration

## Configuration

### Required Environment Variables

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

### Optional Configuration

```bash
# Backend API URL (default: http://localhost:5000/api)
BACKEND_API_URL=http://localhost:5000/api
```

## How to Get a Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Copy the bot token provided
5. Add to `.env` file (never commit to Git!)

## Running the Bot

### Start Backend First

```bash
npm start
```

### Start Bot (separate terminal)

```bash
npm run bot
```

### Development Mode (auto-restart)

```bash
npm run bot:dev
```

## Testing

1. Ensure backend is running on http://localhost:5000
2. Start the bot: `npm run bot`
3. Open Telegram and search for your bot
4. Send `/start` to begin

### Test Checklist

- [ ] Bot starts without errors
- [ ] /start shows welcome message
- [ ] Language selection works (English/Amharic)
- [ ] Main menu appears after language selection
- [ ] Menu buttons respond
- [ ] "Coming soon" message shows for features
- [ ] Back button returns to main menu
- [ ] /menu command works
- [ ] /help command works
- [ ] No secrets exposed in messages
- [ ] Bot stops gracefully with Ctrl+C

## File Structure

```
src/bot/
├── index.js                    # Bot initialization and startup
├── start.js                    # Starter script
├── README.md                   # This file
├── config/
│   ├── languages.js            # Language strings (en, am)
│   └── keyboards.js            # Telegram inline keyboards
├── commands/
│   ├── index.js                # Command registry
│   ├── start.js                # /start command
│   ├── menu.js                 # /menu command
│   └── help.js                 # /help command
├── handlers/
│   ├── callbackHandler.js      # Inline button clicks
│   ├── messageHandler.js       # Text messages
│   └── errorHandler.js         # Error handling
└── services/
    └── userService.js          # telegram_users table operations
```

## Database Integration

### Existing telegram_users Table

The bot uses the existing `telegram_users` table in the Supabase database:

```sql
CREATE TABLE telegram_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);
```

**No modifications were made to this table.**

## Security

✅ Bot token never exposed in logs  
✅ No database credentials in error messages  
✅ No stack traces sent to users  
✅ User-friendly error messages only  
✅ Graceful error handling  

## Next Steps

After testing the foundation:

1. Implement account linking workflow
2. Integrate with backend API endpoints
3. Implement queue management features
4. Implement application tracking
5. Implement maintenance reporting
6. Implement task assignment (with RBAC)
7. Implement announcements & notifications

## Support

For issues or questions, contact the Hawassa MESOB development team.

---

**Version:** 1.0.0 (Foundation)  
**Status:** Testing Phase  
**Last Updated:** August 24, 2026
