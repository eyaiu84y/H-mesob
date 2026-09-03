/**
 * Command handler registry
 * Registers all bot commands
 */

import { handleStart } from './start.js';
import { handleMenu } from './menu.js';
import { handleHelp } from './help.js';
import { handleTestFeedback } from './testfeedback.js';

/**
 * Setup all bot commands
 */
export const setupCommands = (bot) => {
  // /start - Welcome and language selection
  bot.onText(/\/start/, handleStart);

  // /menu - Show main menu
  bot.onText(/\/menu/, handleMenu);

  // /help - Show help
  bot.onText(/\/help/, handleHelp);

  // /testfeedback - Test feedback flow (development/testing)
  bot.onText(/\/testfeedback/, (msg) => handleTestFeedback(bot, msg));

  console.log('✅ Commands registered: /start, /menu, /help, /testfeedback');
};

export default setupCommands;
