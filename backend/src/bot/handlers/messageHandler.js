/**
 * Message handler
 * Handles text messages (non-commands)
 */

import { getMessage } from '../config/languages.js';
import { getMainMenuKeyboard } from '../config/keyboards.js';
import { getUserState } from '../services/userService.js';

/**
 * Setup message handlers
 */
export const setupMessageHandlers = (bot) => {
  // Handle all text messages (except commands)
  bot.on('message', async (msg) => {
    // Skip if it's a command (starts with /)
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    const chatId = msg.chat.id;
    const userState = getUserState(chatId);
    const lang = userState.language || 'en';

    try {
      // For now, any non-command message shows the main menu
      // In future, this will handle conversation flows
      
      const response = lang === 'en'
        ? '👋 Hi! Use the menu below to navigate, or type /help for assistance.'
        : '👋 ሰላም! ለማሰስ ከታች ያለውን ምናሌ ይጠቀሙ ወይም /help ይጻፉ።';

      await bot.sendMessage(chatId, response, {
        reply_markup: getMainMenuKeyboard(lang),
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Message handler error:', error.message);
      // Don't send error message for every invalid input
    }
  });

  console.log('✅ Message handlers registered');
};

export default setupMessageHandlers;
