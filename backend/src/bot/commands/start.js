/**
 * /start command handler
 * Welcome message and language selection
 */

import { getMessage } from '../config/languages.js';
import { getLanguageKeyboard } from '../config/keyboards.js';
import { getUserState } from '../services/userService.js';

/**
 * Handle /start command
 */
export const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const firstName = msg.from.first_name || 'there';

  try {
    // Get user's current language
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';

    // Send welcome message with language selection
    const welcomeMessage = getMessage(lang, 'welcome');
    
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: getLanguageKeyboard(),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error in /start command:', error.message);
    await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
};

export default handleStart;
