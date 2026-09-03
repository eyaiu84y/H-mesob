/**
 * /help command handler
 */

import { getMessage } from '../config/languages.js';
import { getBackKeyboard } from '../config/keyboards.js';
import { getUserState } from '../services/userService.js';

/**
 * Handle /help command
 */
export const handleHelp = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    // Get user's language
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';

    // Send help message
    const helpMessage = getMessage(lang, 'help');
    
    await bot.sendMessage(chatId, helpMessage, {
      reply_markup: getBackKeyboard(lang),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error in /help command:', error.message);
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';
    await bot.sendMessage(chatId, getMessage(lang, 'error'));
  }
};

export default handleHelp;
