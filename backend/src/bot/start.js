/**
 * Telegram Bot Starter Script
 * Starts the Hawassa MESOB Telegram bot
 */

import { startBot } from './index.js';

// Start the bot
try {
  startBot();
} catch (error) {
  console.error('\n❌ Failed to start bot:', error.message);
  process.exit(1);
}
