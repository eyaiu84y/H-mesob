/**
 * Callback query handler
 * Handles inline keyboard button clicks
 */

import { getMessage } from '../config/languages.js';
import { 
  getMainMenuKeyboard, 
  getLanguageKeyboard,
  getSettingsKeyboard,
  getBackKeyboard 
} from '../config/keyboards.js';
import { getUserState, setUserState, setUserLanguage } from '../services/userService.js';
import { handleFeedbackRating } from './feedbackHandler.js';

/**
 * Handle language selection
 */
const handleLanguageSelection = async (bot, query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const language = query.data.replace('lang_', '');

  try {
    // Update user state
    setUserState(chatId, { language });
    
    // Try to update database (if user is linked)
    await setUserLanguage(chatId, language);

    // Send confirmation
    const confirmMessage = getMessage(language, 'languageSelected');
    await bot.answerCallbackQuery(query.id, { text: confirmMessage });

    // Show main menu
    const menuMessage = getMessage(language, 'mainMenu');
    await bot.editMessageText(menuMessage, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: getMainMenuKeyboard(language),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Language selection error:', error.message);
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Error changing language',
      show_alert: true 
    });
  }
};

/**
 * Handle menu navigation
 */
const handleMenuSelection = async (bot, query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const menuItem = query.data.replace('menu_', '');

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    // Foundation only - show "coming soon" for all features
    const comingSoonMessage = getMessage(lang, 'comingSoon');

    await bot.answerCallbackQuery(query.id);

    await bot.editMessageText(comingSoonMessage, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: getBackKeyboard(lang),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Menu selection error:', error.message);
    await bot.answerCallbackQuery(query.id, { 
      text: getMessage(lang, 'error'),
      show_alert: true 
    });
  }
};

/**
 * Handle back to menu
 */
const handleBackToMenu = async (bot, query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    await bot.answerCallbackQuery(query.id);

    const menuMessage = getMessage(lang, 'mainMenu');
    await bot.editMessageText(menuMessage, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: getMainMenuKeyboard(lang),
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Back to menu error:', error.message);
  }
};

/**
 * Handle cancel
 */
const handleCancel = async (bot, query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    await bot.answerCallbackQuery(query.id);

    const cancelMessage = getMessage(lang, 'cancelled');
    await bot.editMessageText(cancelMessage, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: getBackKeyboard(lang)
    });

  } catch (error) {
    console.error('Cancel error:', error.message);
  }
};

/**
 * Handle settings
 */
const handleSettings = async (bot, query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  const action = query.data.replace('settings_', '');

  try {
    await bot.answerCallbackQuery(query.id);

    if (action === 'language') {
      // Show language selection
      const message = lang === 'en' 
        ? '🌐 Select your preferred language:'
        : '🌐 የሚመርጡትን ቋንቋ ይምረጡ:';
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: getLanguageKeyboard()
      });
    } else {
      // Coming soon for other settings
      const comingSoonMessage = getMessage(lang, 'comingSoon');
      await bot.editMessageText(comingSoonMessage, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: getBackKeyboard(lang)
      });
    }

  } catch (error) {
    console.error('Settings error:', error.message);
  }
};

/**
 * Setup callback query handlers
 */
export const setupCallbackHandlers = (bot) => {
  bot.on('callback_query', async (query) => {
    try {
      const data = query.data;

      // Language selection
      if (data.startsWith('lang_')) {
        await handleLanguageSelection(bot, query);
      }
      // Feedback rating
      else if (data.startsWith('feedback_')) {
        await handleFeedbackRating(bot, query);
      }
      // Menu selection
      else if (data.startsWith('menu_')) {
        await handleMenuSelection(bot, query);
      }
      // Settings
      else if (data.startsWith('settings_')) {
        await handleSettings(bot, query);
      }
      // Navigation
      else if (data === 'back_to_menu') {
        await handleBackToMenu(bot, query);
      }
      else if (data === 'cancel') {
        await handleCancel(bot, query);
      }
      // Unknown callback
      else {
        await bot.answerCallbackQuery(query.id, {
          text: '⚠️ Unknown action',
          show_alert: true
        });
      }

    } catch (error) {
      console.error('Callback query error:', error.message);
      try {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ An error occurred',
          show_alert: true
        });
      } catch (e) {
        // Ignore if answer fails
      }
    }
  });

  console.log('✅ Callback handlers registered');
};

export default setupCallbackHandlers;
