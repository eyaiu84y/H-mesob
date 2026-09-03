import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/environment.js';
import { setupCommands } from './commands/index.js';
import { setupCallbackHandlers } from './handlers/callbackHandler.js';
import { setupMessageHandlers } from './handlers/messageHandler.js';
import { setupErrorHandlers } from './handlers/errorHandler.js';
import { setupFeedbackTriggers } from './services/feedbackTriggerService.js';

/**
 * Hawassa MESOB Telegram Bot
 * Foundation implementation - connects to existing backend API
 */

let bot;
let isShuttingDown = false;

/**
 * Initialize and start the Telegram bot
 */
export const startBot = () => {
  try {
    // Validate configuration
    if (!config.telegram.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required but not configured');
    }

    // Initialize bot
    bot = new TelegramBot(config.telegram.botToken, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   🤖 HAWASSA MESOB TELEGRAM BOT STARTED               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('✅ Bot is running and waiting for messages...');
    console.log('🔗 Connected to Telegram API');
    console.log('📊 Backend API: http://localhost:5000/api\n');

    // Setup handlers
    setupCommands(bot);
    setupCallbackHandlers(bot);
    setupMessageHandlers(bot);
    setupErrorHandlers(bot);
    
    // Setup feedback triggers (realtime listeners)
    setupFeedbackTriggers(bot);

    // Handle polling errors
    bot.on('polling_error', (error) => {
      if (!isShuttingDown) {
        console.error('❌ Polling error:', error.message);
        // Don't expose full stack trace
      }
    });

    // Handle successful connection
    bot.on('message', () => {
      // Update last interaction (handled in message handler)
    });

    return bot;

  } catch (error) {
    console.error('\n❌ FAILED TO START TELEGRAM BOT\n');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. TELEGRAM_BOT_TOKEN is set in .env');
    console.error('2. Bot token is valid');
    console.error('3. Bot has not been revoked\n');
    throw error;
  }
};

/**
 * Stop the Telegram bot gracefully
 */
export const stopBot = async () => {
  if (bot && !isShuttingDown) {
    isShuttingDown = true;
    console.log('\n⚠️  Stopping Telegram bot...');
    
    try {
      await bot.stopPolling();
      console.log('✅ Telegram bot stopped gracefully\n');
    } catch (error) {
      console.error('Error stopping bot:', error.message);
    }
  }
};

/**
 * Get the bot instance
 */
export const getBot = () => bot;

/**
 * Graceful shutdown handlers
 */
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received');
  await stopBot();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received');
  await stopBot();
  process.exit(0);
});

// Handle uncaught errors (don't expose secrets)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  // Don't expose stack traces with secrets
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

export default { startBot, stopBot, getBot };
