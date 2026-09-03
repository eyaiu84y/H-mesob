/**
 * /menu command handler
 * Display main menu
 */

import { getMessage } from '../config/languages.js';
import { getMainMenuKeyboard } from '../config/keyboards.js';
import { getUserState } from '../services/userService.js';

/**
 * Handle /menu command
 */
export const handleMenu = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    // Get user's language
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';

    // Send main menu
    const menuMessage = getMessage(lang, 'mainMenu');
    
    await bot.sendMessage(chatId, menuMessage, {
      reply_markup: getMainMenuKeyboard(lang),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error in /menu command:', error.message);
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';
    await bot.sendMessage(chatId, getMessage(lang, 'error'));
  }
};

export default handleMenu;
