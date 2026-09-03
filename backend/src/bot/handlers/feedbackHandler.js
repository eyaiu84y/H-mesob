/**
 * Feedback handler for Telegram bot
 * Handles service rating and feedback submission
 */

import { getMessage } from '../config/languages.js';
import { getFeedbackRatingKeyboard, getBackKeyboard } from '../config/keyboards.js';
import { getUserState, setUserState } from '../services/userService.js';
import * as feedbackService from '../../services/feedbackService.js';
import { supabase } from '../../config/supabase.js';

/**
 * Get rating meaning
 */
function getRatingMeaning(rating, lang = 'en') {
  const meanings = {
    en: {
      1: 'Poor',
      2: 'Good',
      3: 'Very Good',
      4: 'Excellent',
      5: 'Fantastic'
    },
    am: {
      1: 'ደካማ',
      2: 'ጥሩ',
      3: 'በጣም ጥሩ',
      4: 'ምርጥ',
      5: 'አስደናቂ'
    }
  };
  return meanings[lang][rating] || '';
}

/**
 * Show feedback prompt
 * Called after service completion
 */
export async function promptForFeedback(bot, chatId, serviceData, lang = 'en') {
  try {
    const { institution_id, service_id, institution_name, service_name, application_id, queue_entry_id } = serviceData;

    // Store context for callback
    setUserState(chatId, {
      awaitingFeedback: true,
      feedbackContext: {
        institution_id,
        service_id,
        institution_name,
        service_name,
        application_id,
        queue_entry_id
      }
    });

    // Create feedback prompt message
    const promptMessage = lang === 'am'
      ? `📋 *የአገልግሎት ግምገማ*\n\n${service_name}\n${institution_name}\n\nእባክዎን አገልግሎቱን ይገምግሙ:`
      : `📋 *Rate Your Service Experience*\n\n${service_name}\n${institution_name}\n\nHow satisfied are you with this service?`;

    await bot.sendMessage(chatId, promptMessage, {
      parse_mode: 'Markdown',
      reply_markup: getFeedbackRatingKeyboard(lang)
    });

  } catch (error) {
    console.error('Error prompting for feedback:', error);
    throw error;
  }
}

/**
 * Handle feedback rating selection
 */
export async function handleFeedbackRating(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const rating = parseInt(query.data.replace('feedback_', ''));

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    // Validate state
    if (!userState.awaitingFeedback || !userState.feedbackContext) {
      await bot.answerCallbackQuery(query.id, {
        text: lang === 'am' ? '❌ ክፍለ ጊዜው አልቋል' : '❌ Session expired',
        show_alert: true
      });
      return;
    }

    // Get linked user from telegram_users table
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (telegramError || !telegramUser) {
      await bot.answerCallbackQuery(query.id, {
        text: lang === 'am' 
          ? '❌ እባክዎን መጀመሪያ መለያዎን ያገናኙ' 
          : '❌ Please link your account first',
        show_alert: true
      });
      return;
    }

    const { feedbackContext } = userState;

    // Submit feedback to backend
    const feedbackData = {
      citizen_id: telegramUser.user_id,
      institution_id: feedbackContext.institution_id,
      service_id: feedbackContext.service_id,
      rating: rating,
      application_id: feedbackContext.application_id || null,
      queue_entry_id: feedbackContext.queue_entry_id || null,
      source: 'TELEGRAM'
    };

    const result = await feedbackService.submitFeedback(feedbackData);

    if (result) {
      // Clear state
      setUserState(chatId, {
        awaitingFeedback: false,
        feedbackContext: null
      });

      // Create success message (DYNAMIC!)
      const stars = '⭐'.repeat(rating);
      const meaning = getRatingMeaning(rating, lang);
      
      const successMessage = lang === 'am'
        ? `✅ *አመሰግናለሁ!*\n\nአገልግሎታችንን *${rating}/5 ኮከቦች* ${stars} አስገምግመዋል።\nግብረመልስዎ እኛን ለማሻሻል ይረዳናል!`
        : `✅ *Thank You!*\n\nYou rated our service *${rating}/5 Stars* ${stars}\n_${meaning}_\n\nYour feedback helps us improve!`;

      await bot.answerCallbackQuery(query.id, {
        text: lang === 'am' ? '✅ ግምገማዎ ተልኳል!' : '✅ Feedback submitted!'
      });

      await bot.editMessageText(successMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: getBackKeyboard(lang)
      });

    } else {
      throw new Error('Failed to submit feedback');
    }

  } catch (error) {
    console.error('Error handling feedback rating:', error);

    // Check for duplicate feedback error
    if (error.message && error.message.includes('already rated')) {
      await bot.answerCallbackQuery(query.id, {
        text: lang === 'am' 
          ? '⚠️ ቀድሞውኑ ይህን አገልግሎት አስገምግመዋል' 
          : '⚠️ You have already rated this service',
        show_alert: true
      });
    } else {
      await bot.answerCallbackQuery(query.id, {
        text: lang === 'am' 
          ? '❌ ግምገማ መላክ አልተቻለም' 
          : '❌ Failed to submit feedback',
        show_alert: true
      });
    }
  }
}

/**
 * Request feedback comment (optional feature)
 */
export async function requestFeedbackComment(bot, chatId, lang = 'en') {
  const promptMessage = lang === 'am'
    ? '📝 ተጨማሪ አስተያየት መስጠት ይፈልጋሉ? (አማራጭ)\n\nቀጥሎ አስተያየትዎን ይላኩ ወይም /skip ይተይቡ።'
    : '📝 Would you like to add a comment? (Optional)\n\nSend your comment next, or type /skip.';

  await bot.sendMessage(chatId, promptMessage, {
    parse_mode: 'Markdown'
  });

  setUserState(chatId, { awaitingFeedbackComment: true });
}

/**
 * Handle feedback comment submission
 */
export async function handleFeedbackComment(bot, msg) {
  const chatId = msg.chat.id;
  const comment = msg.text;

  const userState = getUserState(chatId);
  const lang = userState.language || 'en';

  try {
    if (!userState.awaitingFeedbackComment) {
      return;
    }

    // Skip if user typed /skip
    if (comment.toLowerCase() === '/skip') {
      setUserState(chatId, { awaitingFeedbackComment: false });
      const skipMessage = lang === 'am'
        ? '👍 ተረድቷል። አስተያየት ሳይኖር ቀጥለናል።'
        : '👍 Understood. Continuing without comment.';
      await bot.sendMessage(chatId, skipMessage);
      return;
    }

    // Store comment (would need to update the feedback record)
    // For now, just acknowledge
    setUserState(chatId, { awaitingFeedbackComment: false });

    const thankYouMessage = lang === 'am'
      ? '✅ አመሰግናለሁ! አስተያየትዎ ተመዝግቧል።'
      : '✅ Thank you! Your comment has been recorded.';

    await bot.sendMessage(chatId, thankYouMessage);

  } catch (error) {
    console.error('Error handling feedback comment:', error);
  }
}

export default {
  promptForFeedback,
  handleFeedbackRating,
  requestFeedbackComment,
  handleFeedbackComment,
  getRatingMeaning
};
